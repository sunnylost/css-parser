let code = ( cp ) => String.fromCharCode( cp )

let NULL                 = code( 0x0 ),
    REPLACEMENT          = code( 0xfffd ),
    CT                   = code( 0x9 ),//CHARACTER TABULATION
    LF                   = code( 0xa ),//LINE FEED
    FF                   = code( 0xc ),//FORM FEED
    CR                   = code( 0xd ),//CARRIAGE RETURN
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
    NEWLINE              = LF,

    //https://drafts.csswg.org/css-syntax-3/#input-preprocessing
    preprocessHanlder    = ( src ) => {
        src = src.replace( new RegExp( `(${ CR }|${ FF }|${ CR + LF })`, 'mg' ), LF )

        return src.replace( new RegExp( NULL, 'mg' ), REPLACEMENT )
    },

    isDigit              = ch => ch.charCodeAt( 0 ) >= 0x30 && ch.charCodeAt( 0 ) <= 0x39,
    isWhitespace         = ch => ch === NEWLINE || ch === CT || ch === SPACE,
    isUppercase          = ch => ch.charCodeAt( 0 ) >= 0x41 && ch.charCodeAt( 0 ) <= 0x5a,
    isLowercase          = ch => ch.charCodeAt( 0 ) >= 0x61 && ch.charCodeAt( 0 ) <= 0x7a,
    isLetter             = ch => isLowercase( ch ) || isUppercase( ch ),
    isNonASCII           = ch => ch.charCodeAt( 0 ) >= 0x80,
    isNameStart          = ch => isLetter( ch ) || isNonASCII( ch ) || ch === LOW_LINE,
    //TODO: reverse slash
    isName               = ch => isNameStart( ch ) || isDigit( ch ) || ch === HYPHEN_MINUS,

    TOKEN_TYPE

function simpleTokenWrapper( type ) {
    return {
        type,
        start: this.pos,
        end  : this.pos + 1,
        value: this.next()
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
        let ch, token

        if ( ch = this.peek() ) {
            if ( token = this.consumeComment() ) {
                return token
            }

            if ( isNameStart( ch ) ) {
                return this.consumeIdent()
            }

            if ( isWhitespace( ch ) ) {
                return this.consumeWhitespace()
            }

            switch ( ch ) {
            case QUOTATION_MARK:
                return this.consumeString()

            case NUMBER_SIGN:
                if ( isName( this.peek() ) ) {
                    return this.consumeHash()
                }

                return simpleTokenWrapper.call( this, TOKEN_TYPE.DELIM )

            case DOLLAR_SIGN:
                if ( (ch = this.peek()) && ch == EQUALS_SIGN ) {
                    return this.consumeSuffixMatch()
                }

                return simpleTokenWrapper.call( this, TOKEN_TYPE.DELIM )

            case COLON:
                return simpleTokenWrapper.call( this, TOKEN_TYPE.COLON )

            case SEMICOLON:
                return simpleTokenWrapper.call( this, TOKEN_TYPE.SEMICOLON )

            case LEFT_CURLY_BRACKET:
                return simpleTokenWrapper.call( this, TOKEN_TYPE.LEFT_BRACE )

            case RIGHT_CURLY_BRACKET:
                return simpleTokenWrapper.call( this, TOKEN_TYPE.RIGHT_BRACE )

            default:
                return {
                    start: this.pos,
                    end  : this.pos + 1,
                    type : 404,
                    value: this.next()
                }
            }
        }

        return {
            start: this.pos,
            end  : this.srcLen - 1,
            type : TOKEN_TYPE.EOF
        }
    }

    //TODO: preprocessHandler
    next( offset = 1 ) {
        if ( ( this.pos + offset ) < this.srcLen ) {
            return this.src[ this.pos += offset ]
        }

        return null
    }

    //TODO: preprocessHandler
    peek( offset = 1 ) {
        if ( ( this.pos + offset ) <= this.srcLen ) {
            return this.src[ this.pos + offset ]
        }

        return null
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
                p1 = this.peek( 1 )
                p2 = this.peek( 2 )

                if ( !p1 || !p2 ||
                    ( p1 !== ASTERISK &&
                    p2 !== SOLIDUS ) ) {
                    comment.push( this.next() )
                } else {
                    break
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

    consumeString() {
        let result = [],
            start  = this.pos,
            type   = TOKEN_TYPE.STRING,
            isEncounterEnd, value, ch, end

        this.next() //first quotation

        while ( ( ch = this.peek() ) ) {
            //TODO: REVERSE SOLIDUS
            //parse error, should reconsume the current input code point. so check this before call this.next()
            if ( ch === NEWLINE ) {
                type = TOKEN_TYPE.BAD_STRING
                break
            }

            if ( ch === REVERSE_SOLIDUS ) {
                if ( !this.peek( 2 ) ) {
                    continue
                }

                if ( this.peek( 2 ).charCodeAt( 0 ) === NEWLINE ) {

                }
            }

            if ( ch === QUOTATION_MARK ) {
                this.next()
                isEncounterEnd = true
                break
            }

            result.push( this.next() )
        }

        if ( !isEncounterEnd ) {
            type = TOKEN_TYPE.BAD_STRING
        }

        end   = this.pos
        value = result.join( '' )

        return {
            start, end, value, type
        }
    }

    consumeNumber() {
    }

    consumeIdent() {
        let result = [],
            start  = this.pos,
            ch, end, value

        while ( ( ch = this.peek() ) && isName( ch ) ) {
            result.push( this.next() )
        }

        //TODO: URL
        if ( ( value = result.join( '' ) ) === 'url' &&
            this.peek() === '('
        ) {
        }

        end = this.pos

        return {
            start, end,
            type : TOKEN_TYPE.IDENT,
            value: result.join( '' )
        }
    }

    consumeHash() {
        //TODO
        let token = {
            start: this.pos,
            type : TOKEN_TYPE.HASH,
            _type: 'unrestricted'//type flag
        }, value  = ''

        return token
    }

    consumeName() {
        let result = '',
            ch

        while ( ch = this.peek() ) {

            if ( isName( ch ) ) {
                result += this.next()
            } else {
                break
            }
        }

        return result
    }

    consumeSuffixMatch() {
        //TODO
    }

    checkValidEscape() {
        if ( this.peek() !== REVERSE_SOLIDUS ) {
            return false
        }

        if ( this.peek( 2 ) === NEWLINE ) {
            return false
        }

        return true
    }

    checkIdentifier() {
        let ch = this.peek()

        if ( ch === HYPHEN_MINUS && isName( this.peek( 2 ) ) ) {
            return true
        }

        if ( isName( ch ) ) {
            return true
        }
    }
}

export default Tokenizer
