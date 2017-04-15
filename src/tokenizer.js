let code = ( cp ) => String.fromCharCode( cp )

let NULL                 = code( 0x0 ),
    REPLACEMENT          = code( 0xfffd ),
    CT                   = code( 0x9 ),//CHARACTER TABULATION
    LF                   = code( 0xa ),//LINE FEED
    LINE_TABULATION      = code( 0xb ),
    FF                   = code( 0xc ),//FORM FEED
    CR                   = code( 0xd ),//CARRIAGE RETURN
    DELETE               = code( 0x7f ),
    SPACE                = code( 0x20 ),
    QUOTATION_MARK       = code( 0x22 ),//"
    NUMBER_SIGN          = code( 0x23 ),//#
    DOLLAR_SIGN          = code( 0x24 ),//$
    APOSTROPHE           = code( 0x27 ),//'
    LEFT_PARENTHESIS     = code( 0x28 ),//(
    RIGHT_PARENTHESIS    = code( 0x29 ),//)
    ASTERISK             = code( 0x2a ),//*
    PLUS_SIGN            = code( 0x2b ),//+
    COMMA                = code( 0x2c ),//,
    HYPHEN_MINUS         = code( 0x2d ),//-
    FULL_STOP            = code( 0x2e ),//.
    SOLIDUS              = code( 0x2f ),///
    COLON                = code( 0x3a ),//:
    SEMICOLON            = code( 0x3b ),//;
    LESS_THAN_SIGN       = code( 0x3c ),//<
    EQUALS_SIGN          = code( 0x3d ),//=
    COMMERCIAL_AT        = code( 0x40 ),//@
    LEFT_SQUARE_BRACKET  = code( 0x5b ),//[
    REVERSE_SOLIDUS      = code( 0x5c ),//\
    RIGHT_SQUARE_BRACKET = code( 0x5d ),//]
    CIRCUMFLEX_ACCENT    = code( 0x5e ),//^
    LOW_LINE             = code( 0x5f ),//_
    LEFT_CURLY_BRACKET   = code( 0x7b ),//{
    RIGHT_CURLY_BRACKET  = code( 0x7d ),//}
    VERTICAL_LINE        = code( 0x7c ),//|
    TILDE                = code( 0x7e ),//~
    EXCLAMATION_MARK     = code( 0x21 ),
    QUESTION_MARK        = code( 0x3f ),
    PERCENTAGE_SIGN      = '%',
    GREATER_THAN_SIGN    = '>',
    NEWLINE              = LF,

    CAPITAL_E            = 'E',
    CAPITAL_F            = 'F',
    CAPITAL_U            = 'U',
    SMALL_E              = 'e',
    SMALL_U              = 'u',
    ZERO                 = '0',

    //https://drafts.csswg.org/css-syntax-3/#input-preprocessing
    preprocessHanlder    = ( src ) => {
        src = src.replace( new RegExp( `(${ CR }|${ FF }|${ CR + LF })`, 'mg' ), LF )

        return src.replace( new RegExp( NULL, 'mg' ), REPLACEMENT )
    },

    isDigit              = ch => ch.charCodeAt( 0 ) >= 0x30 && ch.charCodeAt( 0 ) <= 0x39,
    isHexDigit           = ( ch ) => {
        let cp = ch.codePointAt( 0 )

        //0x41: A
        //0x46: F
        //0x61: a
        //0x66: f
        return isDigit( ch ) || ( cp >= 0x41 && cp <= 0x46 ) || ( cp >= 0x61 && cp <= 0x66 )
    },
    isWhitespace         = ch => ch === NEWLINE || ch === CT || ch === SPACE,
    isUppercase          = ch => ch.charCodeAt( 0 ) >= 0x41 && ch.charCodeAt( 0 ) <= 0x5a,
    isLowercase          = ch => ch.charCodeAt( 0 ) >= 0x61 && ch.charCodeAt( 0 ) <= 0x7a,
    isLetter             = ch => isLowercase( ch ) || isUppercase( ch ),
    isNonASCII           = ch => ch.charCodeAt( 0 ) >= 0x80,
    isNameStart          = ch => isLetter( ch ) || isNonASCII( ch ) || ch === LOW_LINE,
    isName               = ch => isNameStart( ch ) || isDigit( ch ) || ch === HYPHEN_MINUS,
    isSurrogate          = cp => cp >= 0xd800 && cp <= 0xdfff,
    isNonPrintable       = ( ch ) => {
        let cp = ch.codePointAt( 0 )

        return ( cp >= 0x0 && ch <= 0x8 ) || ch === LINE_TABULATION || ch === DELETE || ( cp >= 0xe && cp <= 0x1f )
    },

    TOKEN_TYPE

const MAX_ALLOWED_CODE_POINT = 0x10ffff

/**
 * TODO: fix token position
 */

function simpleTokenWrapper( type, value ) {
    return {
        type,
        start: this.pos,
        end  : this.pos + 1,
        value: value || this.cur
    }
}

class Tokenizer {
    constructor( src ) {
        src = preprocessHanlder( src )

        this.src    = src
        this.srcLen = src.length
        this.tokens = []
        this.cur    = null
        this.pos    = -1
        this.lineNo = 1
    }

    run( TokenType ) {
        let token

        TOKEN_TYPE = TokenType

        while ( token = this.advance() ) {
            this.tokens.push( token )

            if ( token.type === TOKEN_TYPE.EOF ) {
                return this.tokens
            }
        }

        return this.tokens
    }

    advance() {
        let ch

        if ( ch = this.peek() ) {
            //do not consume Unicode Range
            if ( ch !== CAPITAL_U && ch !== SMALL_U && isNameStart( ch ) ) {
                return this.consumeIdent()
            }

            if ( isWhitespace( ch ) ) {
                return this.consumeWhitespace()
            }

            if ( isDigit( ch ) ) {
                return this.consumeNumber()
            }

            this.cur = this.next()

            switch ( ch ) {
            case QUOTATION_MARK:
                return this.consumeString( QUOTATION_MARK )

            case NUMBER_SIGN:
                if ( isName( this.peek() ) || this.checkValidEscape() ) {
                    let token = {
                        start: this.pos,
                        type : TOKEN_TYPE.HASH,
                        _type: 'unrestricted'//type flag
                    }

                    if ( this.checkIdentifier() ) {
                        token._type = 'id'
                    }

                    token.value = this.consumeName()
                    return token
                }

                return simpleTokenWrapper.call( this, TOKEN_TYPE.DELIM )

            case DOLLAR_SIGN:
                if ( ( ch = this.peek() ) && ch == EQUALS_SIGN ) {
                    return simpleTokenWrapper.call( this, TOKEN_TYPE.SUFFIX_MATCH )
                }

                return simpleTokenWrapper.call( this, TOKEN_TYPE.DELIM )

            case APOSTROPHE:
                return this.consumeString( APOSTROPHE )

            case LEFT_PARENTHESIS:
                return simpleTokenWrapper.call( this, TOKEN_TYPE.LEFT_PARENTHESIS )

            case RIGHT_PARENTHESIS:
                return simpleTokenWrapper.call( this, TOKEN_TYPE.RIGHT_PARENTHESIS )

            case ASTERISK:
                if ( this.peek() === EQUALS_SIGN ) {
                    return simpleTokenWrapper.call( this, TOKEN_TYPE.SUBSTRING_MATCH, this.next() )
                }

                return simpleTokenWrapper.call( this, TOKEN_TYPE.DELIM )

            case PLUS_SIGN:
                if ( this.checkStarWithNumber( ch, this.peek(), this.peek( 2 ) ) ) {
                    this.reconsume()
                    return this.consumeNumber()
                }

                return simpleTokenWrapper.call( this, TOKEN_TYPE.DELIM )

            case COMMA:
                return simpleTokenWrapper.call( this, TOKEN_TYPE.COMMA )

            case HYPHEN_MINUS:
                if ( this.checkStarWithNumber( ch, this.peek(), this.peek( 2 ) ) ) {
                    this.reconsume()
                    return this.consumeNumber()
                } else if ( this.checkIdentifier() ) {
                    this.reconsume()
                    return this.consumeIdent()
                } else if ( this.peek() === HYPHEN_MINUS && this.peek( 2 ) === GREATER_THAN_SIGN ) {
                    return simpleTokenWrapper.call( this, TOKEN_TYPE.CDC, ch + this.next( 2 ) )
                }

                return simpleTokenWrapper.call( this, TOKEN_TYPE.DELIM )

            case FULL_STOP:
                if ( this.checkStarWithNumber( ch, this.peek(), this.peek( 2 ) ) ) {
                    this.reconsume()
                    return this.consumeNumber()
                }

                return simpleTokenWrapper.call( this, TOKEN_TYPE.DELIM )

            case SOLIDUS:
                if ( this.peek() === ASTERISK ) {
                    this.reconsume()
                    return this.consumeComment()
                }

                return simpleTokenWrapper.call( this, TOKEN_TYPE.DELIM )

            case COLON:
                return simpleTokenWrapper.call( this, TOKEN_TYPE.COLON )

            case SEMICOLON:
                return simpleTokenWrapper.call( this, TOKEN_TYPE.SEMICOLON )

            case LESS_THAN_SIGN:
                if ( this.peek() === EXCLAMATION_MARK && this.peek( 2 ) === HYPHEN_MINUS && this.peek( 3 ) === HYPHEN_MINUS ) {
                    return simpleTokenWrapper.call( this, TOKEN_TYPE.CDO, ch + this.next( 3 ) )
                }

                return simpleTokenWrapper.call( this, TOKEN_TYPE.DELIM )

            case COMMERCIAL_AT:
                if ( this.checkIdentifier() ) {
                    return simpleTokenWrapper.call( this, TOKEN_TYPE.AT_KEYWORD, this.consumeName() )
                }

                return simpleTokenWrapper.call( this, TOKEN_TYPE.DELIM )

            case LEFT_SQUARE_BRACKET:
                return simpleTokenWrapper.call( this, TOKEN_TYPE.LEFT_SQUARE_BRACKET )

            case REVERSE_SOLIDUS:
                if ( this.checkValidEscape() ) {
                    this.reconsume()
                    return simpleTokenWrapper.call( this, TOKEN_TYPE.IDENT, this.consumeIdent() )
                }

                return simpleTokenWrapper.call( this, TOKEN_TYPE.DELIM )

            case RIGHT_SQUARE_BRACKET:
                return simpleTokenWrapper.call( this, TOKEN_TYPE.RIGHT_SQUARE_BRACKET )

            case CIRCUMFLEX_ACCENT:
                if ( this.peek() === EQUALS_SIGN ) {
                    return simpleTokenWrapper.call( this, TOKEN_TYPE.PREFIX_MATCH, ch + this.next() )
                }

                return simpleTokenWrapper.call( this, TOKEN_TYPE.DELIM )

            case LEFT_CURLY_BRACKET:
                return simpleTokenWrapper.call( this, TOKEN_TYPE.LEFT_CURLY_BRACKET )

            case RIGHT_CURLY_BRACKET:
                return simpleTokenWrapper.call( this, TOKEN_TYPE.RIGHT_CURLY_BRACKET )

            case CAPITAL_U:
            case SMALL_U:
                if ( this.peek() === PLUS_SIGN && ( isHexDigit( this.peek( 2 ) ) || this.peek( 2 ) === QUESTION_MARK ) ) {
                    this.next()
                    return this.consumeUnicodeRange()
                }

                this.reconsume()
                return this.consumeIdent()

            case VERTICAL_LINE:
                if ( this.peek() === EQUALS_SIGN ) {
                    return simpleTokenWrapper.call( this, TOKEN_TYPE.DASH_MATCH, ch + this.next() )
                } else if ( this.peek() === VERTICAL_LINE ) {
                    return simpleTokenWrapper.call( this, TOKEN_TYPE.COLUMN, ch + this.next() )
                }

                return simpleTokenWrapper.call( this, TOKEN_TYPE.DELIM )

            case TILDE:
                if ( this.peek() === EQUALS_SIGN ) {
                    return simpleTokenWrapper.call( this, TOKEN_TYPE.INCLUDE_MATCH, ch + this.next() )
                }

                return simpleTokenWrapper.call( this, TOKEN_TYPE.DELIM )

            default:
                return {
                    start: this.pos,
                    end  : this.pos + 1,
                    type : TOKEN_TYPE.DELIM,
                    value: ch
                }
            }
        }

        return {
            start: this.pos,
            end  : this.srcLen - 1,
            type : TOKEN_TYPE.EOF
        }
    }

    next( offset = 1 ) {
        if ( ( this.pos + offset ) < this.srcLen ) {
            if ( offset === 1 ) {
                return this.src[ ++this.pos ]
            } else {
                let result = []

                while ( offset-- ) {
                    result.push( this.src[ ++this.pos ] )
                }

                return result.join( '' )
            }
        }

        return null
    }

    peek( offset = 1 ) {
        if ( ( this.pos + offset ) <= this.srcLen ) {
            return this.src[ this.pos + offset ]
        }

        return null
    }

    reconsume( offset = 1 ) {
        this.pos -= offset
    }

    consumeComment() {
        let comment = [],
            p1, p2, value, start, end

        p1 = this.peek( 1 )
        p2 = this.peek( 2 )

        if ( p1 && p2 &&
            p1 === SOLIDUS &&
            p2 === ASTERISK
        ) {
            start = this.pos
            comment.push( p1, p2 )
            this.pos += 2

            while ( 1 ) {
                p1 = this.peek()
                p2 = this.peek( 2 )

                if ( !p1 || ( p1 === ASTERISK && p2 === SOLIDUS ) ) {
                    break
                } else {
                    comment.push( this.next() )
                }
            }

            comment.push( p1, p2 )
            this.next( 2 )
            end   = this.pos
            value = comment.join( '' )

            return {
                start, end, value,
                type: TOKEN_TYPE.COMMENT
            }
        }

        return null
    }

    consumeWhitespace() {
        let start      = this.pos,
            whitespace = [],
            ch, end

        while ( ( ch = this.peek() ) && isWhitespace( ch ) ) {
            whitespace.push( this.next() )
        }

        end = this.pos

        return {
            start, end,
            type : TOKEN_TYPE.WHITESPACE,
            value: whitespace.join( '' )
        }
    }

    consumeString( ending ) {
        let result = [],
            start  = this.pos,
            type   = TOKEN_TYPE.STRING,
            isEncounterEnding, value, ch, end

        while ( ( ch = this.peek() ) ) {
            //parse error, should reconsume the current input code point. so check this before call this.next()
            if ( ch === NEWLINE ) {
                type = TOKEN_TYPE.BAD_STRING
                break
            }

            if ( ch === REVERSE_SOLIDUS ) {
                if ( !this.peek( 2 ) ) {
                    break
                }

                if ( this.peek( 2 ).charCodeAt( 0 ) === NEWLINE ) {
                    this.next()
                    continue
                }

                if ( this.checkValidEscape() ) {
                    result.push( this.consumeEscapedCodePoint() )
                    continue
                }
            }

            if ( ch === ending ) {
                this.next()
                isEncounterEnding = true
                break
            }

            result.push( this.next() )
        }

        if ( !isEncounterEnding ) {
            type = TOKEN_TYPE.BAD_STRING
        }

        end   = this.pos
        value = result.join( '' )

        return {
            start, end, value, type
        }
    }

    consumeNumber() {
        let number = this._consumeNumber()

        if ( this.checkIdentifier() ) {
            let unitToken = simpleTokenWrapper.call( this, TOKEN_TYPE.DIMENSION, number )

            unitToken._unit = this.consumeName()

            return unitToken
        } else if ( this.peek() === PERCENTAGE_SIGN ) {
            number.value += this.next()
            return simpleTokenWrapper.call( this, TOKEN_TYPE.PERCENTAGE, number )
        }

        return simpleTokenWrapper.call( this, TOKEN_TYPE.NUMBER, number )
    }

    /**
     * return a tuple
     */
    _consumeNumber() {
        let repr = '',
            type = 'integer',
            ch   = this.peek(),
            value

        if ( ch === PLUS_SIGN || ch === HYPHEN_MINUS ) {
            repr += this.next()
        }

        while ( ( ch = this.peek() ) && isDigit( ch ) ) {
            repr += this.next()
        }

        if ( this.peek() === FULL_STOP && isDigit( this.peek( 2 ) ) ) {
            repr += this.next( 2 )
            type = 'number'

            while ( ( ch = this.peek() ) && isDigit( ch ) ) {
                repr += this.next()
            }
        }

        let a = this.peek(),
            b = this.peek( 2 ),
            c = this.peek( 3 )

        if ( a === CAPITAL_E || a === SMALL_E ) {
            let canConsume

            if ( isDigit( b ) ) {
                repr += this.next( 2 )
                type       = 'number'
                canConsume = true
            } else if ( ( b === HYPHEN_MINUS || b === PLUS_SIGN ) && isDigit( c ) ) {
                repr += this.next( 3 )
                type       = 'number'
                canConsume = true
            }

            if ( canConsume ) {
                while ( ( ch = this.peek() ) && isDigit( ch ) ) {
                    repr += this.next()
                }
            }
        }

        value = parseInt( repr )

        return {
            repr, value, type
        }
    }

    consumeIdent() {
        let value = '',
            start = this.pos,
            end

        value = this.consumeName()

        if ( value === 'url' &&
            this.peek() === LEFT_PARENTHESIS
        ) {
            this.next()
            return this.consumeURL()
        } else if ( this.peek() === LEFT_PARENTHESIS ) {
            this.next()
            return {
                start,
                end : start + value.length,
                type: TOKEN_TYPE.FUNCTION,
                value
            }
        }

        end = start + value.length

        return {
            start, end,
            type: TOKEN_TYPE.IDENT,
            value
        }
    }

    consumeName() {
        let result = '',
            ch

        while ( ch = this.peek() ) {
            if ( isName( ch ) ) {
                result += this.next()
            } else if ( this.checkValidEscape() ) {
                result += this.consumeEscapedCodePoint()
            } else {
                break
            }
        }

        return result
    }

    consumeEscapedCodePoint() {
        this.next() //consume reverse solidus

        let result   = '',
            hexCount = 0,
            ch

        while ( ch = this.peek() ) {
            if ( isHexDigit( ch ) ) {
                if ( hexCount <= 5 ) {
                    result += this.next()
                    hexCount++
                }
            } else if ( isWhitespace( ch ) ) {
                result += this.next()
            } else {
                break
            }
        }

        if ( hexCount ) {
            let value = parseInt( result, 16 )

            if ( value === 0 || value > MAX_ALLOWED_CODE_POINT || isSurrogate( value ) ) {
                return REPLACEMENT
            } else {
                return String.fromCharCode( value )
            }
        }

        return REPLACEMENT
    }

    consumeUnicodeRange() {
        let ch,
            count = 0,
            value = '',
            token = {
                type : TOKEN_TYPE.UNICODE_RANGE,
                start: this.pos
            },
            isHexEnough, hasQuestionMark,
            startRange, endRange

        while ( ( ch = this.next() ) && count <= 6 ) {
            if ( !isHexEnough && isHexDigit( ch ) ) {
                value += ch
                count++
            } else if ( ch === QUESTION_MARK ) {
                value += ch
                count++
                hasQuestionMark = isHexEnough = true
            } else {
                this.reconsume()
                break
            }
        }

        if ( hasQuestionMark ) {
            startRange = parseInt( value.replace( /\?/g, ZERO ), 16 )
            endRange   = parseInt( value.replace( /\?/g, CAPITAL_F ), 16 )

            token.startRange = startRange
            token.endRange   = endRange
            token.value      = value
            token.end        = token.start + value.length
            return token
        } else {
            startRange = parseInt( value, 16 )
        }

        if ( this.peek() === HYPHEN_MINUS && isHexDigit( this.peek( 2 ) ) ) {
            value += this.next()
            count = 0

            let tmpVal = ''

            while ( ( ch = this.next() ) && isHexDigit( ch ) && count <= 6 ) {
                tmpVal += ch
                value += ch
                count++
            }

            this.reconsume()
            endRange = parseInt( tmpVal, 16 )
        } else {
            endRange = startRange
        }

        token.startRange = startRange
        token.endRange   = endRange
        token.value      = value
        token.end        = token.start + value.length
        return token
    }

    consumeURL() {
        let token = {
                type : TOKEN_TYPE.URL,
                start: this.pos,
                value: ''
            },
            value = '',
            ch

        this.consumeWhitespace()
        ch = this.peek()

        if ( !ch ) { //EOF
            return token
        }

        if ( ch === QUOTATION_MARK || ch === APOSTROPHE ) {
            this.next()
            let stringToken = this.consumeString( ch )

            if ( stringToken.type === TOKEN_TYPE.BAD_STRING ) {
                this.consumeRemnantsOfABadURL()
                token.type  = TOKEN_TYPE.BAD_URL
                token.value = stringToken.value
                return token
            }

            token.value = stringToken.value
            this.consumeWhitespace()

            if ( !this.peek() || this.peek() === RIGHT_PARENTHESIS ) {
                this.next()
                return token
            } else {
                this.consumeRemnantsOfABadURL()
                token.type = TOKEN_TYPE.BAD_URL
                return token
            }
        }

        while ( ch = this.peek() ) {
            if ( ch === RIGHT_PARENTHESIS ) {
                this.next()
                break
            }

            if ( isWhitespace( ch ) ) {
                this.consumeWhitespace()

                if ( !this.peek() || this.peek() === RIGHT_PARENTHESIS ) {
                    this.next()
                } else {
                    this.consumeRemnantsOfABadURL()
                    token.type = TOKEN_TYPE.BAD_URL
                }

                break
            }

            if ( ch === QUOTATION_MARK || ch === APOSTROPHE || ch === LEFT_PARENTHESIS || isNonPrintable( ch ) ) {
                this.consumeRemnantsOfABadURL()
                token.type = TOKEN_TYPE.BAD_URL
                break
            }

            if ( ch === REVERSE_SOLIDUS ) {
                if ( this.checkValidEscape() ) {
                    value += this.consumeEscapedCodePoint()
                } else {
                    //parse error
                    this.consumeRemnantsOfABadURL()
                    token.type = TOKEN_TYPE.BAD_URL
                    break
                }
            }

            value += this.next()
        }

        token.value = value
        token.end   = token.start + value.length
        return token
    }

    /**
     * this method won't return anything
     */
    consumeRemnantsOfABadURL() {
        let ch

        while ( ch = this.peek() ) {
            if ( ch === RIGHT_PARENTHESIS ) {
                this.next()
                return
            } else if ( this.checkValidEscape() ) {
                this.consumeEscapedCodePoint()
            }

            this.next()
        }
    }

    checkValidEscape( a, b ) {
        if ( !arguments.length ) {
            a = this.peek()
            b = this.peek( 2 )
        }

        if ( a !== REVERSE_SOLIDUS ) {
            return false
        }

        if ( b === NEWLINE ) {
            return false
        }

        return true
    }

    checkIdentifier() {
        let ch = this.peek()

        if ( ch === HYPHEN_MINUS ) {
            if ( isNameStart( this.peek( 2 ) ) || this.checkValidEscape( this.peek( 2 ), this.peek( 3 ) ) ) {
                return true
            }
        }

        if ( isNameStart( ch ) ) {
            return true
        }

        if ( ch === REVERSE_SOLIDUS && this.checkValidEscape() ) {
            return true
        }

        return false
    }

    checkStarWithNumber( a, b, c ) {
        if ( !arguments.length ) {
            a = this.cur
            b = this.peek()
            c = this.peek( 2 )
        }

        if ( a === PLUS_SIGN || a === HYPHEN_MINUS ) {
            if ( isDigit( b ) || ( b === FULL_STOP && isDigit( c ) ) ) {
                return true
            }
        }

        if ( a === FULL_STOP && isDigit( b ) ) {
            return true
        }

        if ( isDigit( a ) ) {
            return true
        }

        return false
    }
}

export default Tokenizer
