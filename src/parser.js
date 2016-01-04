let TOKEN_TYPE

class Parser {
    constructor( tokens ) {
        if ( !tokens || !tokens.length ) {
            return []
        }

        this.tokens = tokens
    }

    run( TokenType ) {
        TOKEN_TYPE = TokenType
        return this.parseStyleSheet()
    }

    //https://drafts.csswg.org/css-syntax-3/#parse-stylesheet
    parseStyleSheet() {
        let stylesheet = {},
            rules, firstRule

        rules     = this.parseRules()
        firstRule = rules[ 0 ]

        if ( isAtRule( firstRule ) &&
            firstRule.name.toLowerCase() === 'charset' ) {
            rules.shift()
        }

        return stylesheet
    }

    //https://drafts.csswg.org/css-syntax-3/#parse-list-of-rules
    parseListOfRules() {
        let tokens = this.tokens,
            len    = tokens.length,
            rules  = []

        for ( let i = 0; i < len; i++ ) {
            let token = tokens[ i ],
                type  = token.type

            switch ( type ) {
                case TOKEN_TYPE.WHITESPACE:
                    break

                case TOKEN_TYPE.EOF:
                    return rules

                case TOKEN_TYPE.CDC:
                case TOKEN_TYPE.CDO:
                    //TODO
                    if ( !this.topLevel ) {
                        rules.push( this.consumeQualifiedRule() )
                    }
                    break

                case TOKEN_TYPE.AT_KEYWORD:
                    rules.push( this.consumeAtRule() )
                    break

                default:
                    this.consumeQualifiedRule()
            }
        }
    }

    //https://drafts.csswg.org/css-syntax-3/#parse-rule
    parseRule() {
        let tokens = this.tokens

        while ( 1 ) {
            if ( tokens[ 0 ].type !== TOKEN_TYPE.WHITESPACE ) {
                break
            } else {
                tokens.shift()
            }
        }

        if ( tokens[ 0 ] == TOKEN_TYPE.EOF ) {
            throw Error( 'syntax error' )
        }
    }

    //https://drafts.csswg.org/css-syntax-3/#parse-declaration
    parseDeclaration() {

    }

    //https://drafts.csswg.org/css-syntax-3/#parse-list-of-declarations
    parseListOfDeclarations() {

    }

    //https://drafts.csswg.org/css-syntax-3/#parse-component-value
    parseComponentValue() {

    }

    //https://drafts.csswg.org/css-syntax-3/#parse-list-of-component-values
    parseListOfComponentValues() {

    }

    //https://drafts.csswg.org/css-syntax-3/#parse-comma-separated-list-of-component-values
    parseCommaSeparatedListOfComponentValues() {
    }

    consumeQualifiedRule() {

    }

    consumeAtRule() {
    }
}

export default Parser
