import TOKEN_TYPE from './tokenType'

let mirrorType = {
    [TOKEN_TYPE.LEFT_SQUARE_BRACKET]: TOKEN_TYPE.RIGHT_SQUARE_BRACKET,
    [TOKEN_TYPE.LEFT_PARENTHESIS]: TOKEN_TYPE.RIGHT_PARENTHESIS,
    [TOKEN_TYPE.LEFT_CURLY_BRACKET]: TOKEN_TYPE.RIGHT_CURLY_BRACKET
}

const STYLESHEET = 'STYLESHEET',
    QUALIFIED_RULE = 'QUALIFIED_RULE',
    AT_RULE = 'AT_RULE',
    BLOCK = 'BLOCK',
    DECLARATION = 'DECLARATION',
    FUNCTION = 'FUNCTION',
    IMPORTANT = 'IMPORTANT',
    SYNTAX_ERROR = 'SYNTAX_ERROR',
    TYPES = {
        STYLESHEET,
        QUALIFIED_RULE,
        AT_RULE,
        BLOCK,
        DECLARATION,
        FUNCTION,
        SYNTAX_ERROR
    }

class Parser {
    constructor(tokenizer) {
        this.tokenizer = tokenizer
        this.cur = null
        this.prevTokens = []
    }

    run() {
        return this.parseStyleSheet()
    }

    next() {
        if (this.prevTokens.length) {
            return this.prevTokens.shift()
        } else {
            return (this.cur = this.tokenizer.advance())
        }
    }

    reconsume() {
        this.cur && this.prevTokens.push(this.cur)
    }

    //https://drafts.csswg.org/css-syntax-3/#parse-stylesheet
    parseStyleSheet() {
        return {
            type: TYPES.STYLESHEET,
            value: this.consumeListOfRules({
                topLevel: true
            })
        }
    }

    parseListOfRules() {
        //unset topLevel
        return this.consumeListOfRules()
    }

    parseRule() {
        let token = this.next()
        let rule

        while (token.type === TOKEN_TYPE.WHITESPACE) {
            token = this.next()
        }

        if (token.type === TOKEN_TYPE.EOF) {
            return {
                type: TYPES.SYNTAX_ERROR
            }
        } else if (token.type === TOKEN_TYPE.AT_KEYWORD) {
            return this.consumeAtRule()
        } else {
            rule = this.consumeQualifiedRule()

            if (!rule) {
                return {
                    type: TYPES.SYNTAX_ERROR
                }
            }
        }

        token = this.next()

        while (token.type === TOKEN_TYPE.WHITESPACE) {
            token = this.next()
        }

        if (token.type === TOKEN_TYPE.EOF) {
            return rule
        } else {
            return {
                type: TYPES.SYNTAX_ERROR
            }
        }
    }

    parseDeclaration() {
        let token = this.next()

        while (token.type === TOKEN_TYPE.WHITESPACE) {
            token = this.next()
        }

        if (token.type !== TOKEN_TYPE.IDENT) {
            return {
                type: TYPES.SYNTAX_ERROR
            }
        }

        return (
            this.consumeDeclaration() || {
                type: TYPES.SYNTAX_ERROR
            }
        )
    }

    parseListOfDeclaration() {
        return this.consumeListOfDeclarations()
    }

    parseComponent() {
        let token = this.next()

        while (token.type === TOKEN_TYPE.WHITESPACE) {
            token = this.next()
        }

        if (token.type === TOKEN_TYPE.EOF) {
            return {
                type: TYPES.SYNTAX_ERROR
            }
        }

        let value = this.consumeComponent()

        token = this.next()

        while (token.type === TOKEN_TYPE.WHITESPACE) {
            token = this.next()
        }

        if (token.type === TOKEN_TYPE.EOF) {
            return value
        } else {
            return {
                type: TYPES.SYNTAX_ERROR
            }
        }
    }

    parseListOfComponent() {
        let list = []
        let token

        //TODO: 5.3.8
        while ((token = this.next()) && token.type !== TOKEN_TYPE.EOF) {
            list.push(this.consumeComponent())
        }

        return list
    }

    //TODO
    parseCommaSeparatedListOfComponent() {
        let cvls = []
        let list = []

        while (1) {
            let token = this.consumeComponent()

            if (token.type === TOKEN_TYPE.EOF) {
                cvls.push(list)
                list.length = 0
                break
            } else if (token.type === TOKEN_TYPE.COMMA) {
                cvls.push(list)
                list.length = 0
            } else {
                list.push(token)
            }
        }

        return cvls
    }

    //5.4.1
    consumeListOfRules(opts = {}) {
        let rules = []
        let token
        let qualifiedRule

        while ((token = this.next())) {
            let type = token.type

            switch (type) {
                case TOKEN_TYPE.WHITESPACE:
                    break

                case TOKEN_TYPE.EOF:
                    return rules

                case TOKEN_TYPE.CDC:
                case TOKEN_TYPE.CDO:
                    if (!opts.topLevel) {
                        this.reconsume()
                        qualifiedRule = this.consumeQualifiedRule()
                        qualifiedRule && rules.push(qualifiedRule)
                    }
                    break

                case TOKEN_TYPE.AT_KEYWORD:
                    this.reconsume()

                    let atRule = this.consumeAtRule()
                    atRule && rules.push(atRule)
                    break

                default:
                    this.reconsume()
                    qualifiedRule = this.consumeQualifiedRule()
                    qualifiedRule && rules.push(qualifiedRule)
            }
        }

        return rules
    }

    //5.4.2
    consumeAtRule() {
        let token = this.next()
        let atRule = {
            type: TYPES.AT_RULE,
            name: token.value,
            prelude: []
        }

        while ((token = this.next())) {
            let type = token.type

            //EOF: parse error
            if (type === TOKEN_TYPE.SEMICOLON || type === TOKEN_TYPE.EOF) {
                break
            } else if (type === TOKEN_TYPE.LEFT_CURLY_BRACKET) {
                atRule.block = this.consumeSimpleBlock(type)
                break
                //TODO: simple block with an associated token of <{-token>
            } else {
                this.reconsume()
                atRule.prelude.push(this.consumeComponent())
            }
        }

        return atRule
    }

    //5.4.3
    consumeQualifiedRule() {
        let rule = {
            type: TYPES.QUALIFIED_RULE,
            prelude: []
        }
        let token

        while ((token = this.next())) {
            let type = token.type

            if (type === TOKEN_TYPE.EOF) {
                //parse error
                rule = null
                break
            } else if (type === TOKEN_TYPE.LEFT_CURLY_BRACKET) {
                rule.block = this.consumeSimpleBlock(type)
                break
                //TODO: consume simple block
            } else {
                this.reconsume()
                rule.prelude.push(this.consumeComponent())
            }
        }

        return rule
    }

    //5.4.4
    consumeListOfDeclarations() {
        let list = []
        let token
        let _token

        while ((token = this.next())) {
            switch (token.type) {
                case TOKEN_TYPE.WHITESPACE:
                case TOKEN_TYPE.SEMICOLON:
                    continue

                case TOKEN_TYPE.EOF:
                    break

                case TOKEN_TYPE.AT_KEYWORD:
                    this.reconsume()
                    list.push(this.consumeAtRule())
                    break

                case TOKEN_TYPE.IDENT:
                    let _list = [this.cur]

                    while (
                        (_token = this.next()) &&
                        _token.type !== TOKEN_TYPE.EOF &&
                        _token.type !== TOKEN_TYPE.SEMICOLON
                    ) {
                        _list.push(this.consumeComponent())
                    }

                    let result = this.consumeDeclaration(_list) //TODO: from _list

                    result && list.push(result)
                    break

                default:
                    //parse error
                    this.reconsume()

                    while (
                        (_token = this.next()) &&
                        _token.type !== TOKEN_TYPE.EOF &&
                        _token.type !== TOKEN_TYPE.SEMICOLON
                    ) {
                        this.consumeComponent()
                        //do nothing
                    }
            }
        }

        return list
    }

    //5.4.5
    consumeDeclaration() {
        let declaration = {
            type: TYPES.DECLARATION,
            value: []
        }
        let token = this.next()

        while (token.type === TOKEN_TYPE.WHITESPACE) {
            token = this.next()
        }

        if (token.type !== TOKEN_TYPE.COLON) {
            //parse error
            return
        }

        while ((token = this.next())) {
            if (token.type !== TOKEN_TYPE.WHITESPACE) {
                if (token.type !== TOKEN_TYPE.EOF) {
                    declaration.value.push(this.consumeComponent())
                } else {
                    //TODO
                    return declaration
                }
            }
        }

        let value = declaration.value
        let last = value[value.lenght - 1]
        let nextToLast = value[value.length - 2]

        //parse !important
        if (
            last &&
            nextToLast &&
            nextToLast.type === TOKEN_TYPE.DELIM &&
            nextToLast.value === '!' &&
            last.type === TOKEN_TYPE.IDENT &&
            last.value === IMPORTANT
        ) {
            declaration.important = true
        }

        return declaration
    }

    //5.4.6
    consumeComponent() {
        let token = this.next()
        let type = token.type

        if (
            type === TOKEN_TYPE.LEFT_SQUARE_BRACKET ||
            type === TOKEN_TYPE.LEFT_PARENTHESIS ||
            type === TOKEN_TYPE.LEFT_CURLY_BRACKET
        ) {
            return this.consumeSimpleBlock(type)
        } else if (type === TOKEN_TYPE.FUNCTION) {
            return this.consumeFunction()
        } else {
            return token
        }
    }

    //5.4.7
    consumeSimpleBlock(ending) {
        let endingTokenType = mirrorType[ending]
        let block = {
            type: TYPES.BLOCK,
            token: this.cur,
            value: []
        }
        let token

        while ((token = this.next())) {
            if (token.type === TOKEN_TYPE.EOF || token.type === endingTokenType) {
                break
            } else {
                this.reconsume()
                block.value.push(this.consumeComponent())
            }
        }

        return block
    }

    //5.4.8
    consumeFunction() {
        let cur = this.cur
        let func = {
            type: TYPES.FUNCTION,
            name: cur.value,
            value: []
        }
        let token

        while ((token = this.next())) {
            if (token.type === TOKEN_TYPE.EOF || token.type === TOKEN_TYPE.RIGHT_PARENTHESIS) {
                return func
            } else {
                this.reconsume()
                func.value.push(this.consumeComponent())
            }
        }
    }
}

export default Parser
