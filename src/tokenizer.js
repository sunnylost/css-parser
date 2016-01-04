let NULL                 = null,
    CT                   = 0x9,//CHARACTER TABULATION
    LF                   = 0xa,//LINE FEED
    FF                   = 0xc,//FORM FEED
    CR                   = 0xd,//CARRIAGE RETURN
    SPACE                = 0x20,
    QUOTATION_MARK       = 0x22,//"
    NUMBER_SIGN          = 0x23,//#
    DOLLAR_SIGN          = 0x24,//$
    APOSTROPHE           = 0x27,//'
    LEFT_PARENTHESIS     = 0x28,//(
    RIGHT_PARENTHESIS    = 0x29,//)
    ASTERISK             = 0x2a,//*
    PLUS_SIGN            = 0x2b,//+
    COMMA                = 0x2c,//,
    HYPHEN_MINUS         = 0x2d,//-
    FULL_STOP            = 0x2e,//.
    SOLIDUS              = 0x2f,///
    COLON                = 0x3a,//:
    SEMICOLON            = 0x3b,//;
    LESS_THAN_SIGN       = 0x3c,//<
    EQUALS_SIGN          = 0x3d,//=
    COMMERCIAL_AT        = 0x40,//@
    LEFT_SQUARE_BRACKET  = 0x5b,//[
    REVERSE_SOLIDUS      = 0x5c,//\
    RIGHT_SQUARE_BRACKET = 0x5d,//]
    CIRCUMFLEX_ACCENT    = 0x5e,//^
    LOW_LINE             = 0x5f,//_
    LEFT_CURLY_BRACKET   = 0x7b,//{
    RIGHT_CURLY_BRACKET  = 0x7d,//}
    VERTICAL_LINE        = 0x7c,//|
    TILDE                = 0x7e,//~
    NEWLINE              = LF,

    //https://drafts.csswg.org/css-syntax-3/#input-preprocessing
    preprocessHanlder    = ( cur, next ) => {
        let curCP  = cur.codePointAt( 0 ),
            nextCP = next.codePointAt( 0 )

        if (
            curCP === CR ||
            curCP === FF ||
            ( curCP === CR && nextCP === LF )
        ) {
            return String.fromCodePoint( LF )
        }

        return cur
    },

    isDigit              = cp => cp >= 0x30 && cp <= 0x39,
    isWhitespace         = cp => cp === NEWLINE || cp === CT || cp === SPACE,
    isUppercase          = cp => cp >= 0x41 && cp <= 0x5a,
    isLowercase          = cp => cp >= 0x61 && cp <= 0x7a,
    isLetter             = cp => isLowercase( cp ) || isUppercase( cp ),
    isNonASCII           = cp => cp >= 0x80,
    isNameStart          = cp => isLetter( cp ) || isNonASCII( cp ) || cp === LOW_LINE,
    //TODO: reverse slash
    isName               = cp => isNameStart( cp ) || isDigit( cp ) || cp === HYPHEN_MINUS,

    TOKEN_TYPE

function simpleTokenWrapper( type ) {
    return {
               type,
        start: this.pos,
        end:   this.pos + 1,
        value: this.next()
    }
}

class Tokenizer {
    constructor( src ) {
        this.src    = src
        this.srcLen = src.length
        this.tokens = []
        this.cur    = null
        this.pos    = 0
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
        let ch, cp, token

        if ( ch = this.peek() ) {
            cp = ch.codePointAt( 0 )

            if ( token = this.consumeComment() ) {
                return token
            }

            if ( isNameStart( cp ) ) {
                return this.consumeIdent()
            }

            switch ( cp ) {
                case NEWLINE:
                case CT:
                case SPACE:
                    return this.consumeWhitespace()

                case QUOTATION_MARK:
                    return this.consumeString()

                case COLON:
                    return simpleTokenWrapper.call( this, TOKEN_TYPE.COLON )

                case SEMICOLON:
                    return simpleTokenWrapper.call( this, TOKEN_TYPE.SEMICOLON )

                case LEFT_CURLY_BRACKET:
                    return simpleTokenWrapper.call( this, TOKEN_TYPE.LEFT_BRACE )

                case RIGHT_CURLY_BRACKET:
                    return simpleTokenWrapper.call( this, TOKEN_TYPE.RIGHT_BRACE )

                case NUMBER_SIGN:
                    if ( isName( this.peek() ) ) {
                        return this.consumeHash()
                    }

                    return simpleTokenWrapper.call( this, TOKEN_TYPE.DELIM )

                case DOLLAR_SIGN:
                    if ( (ch = this.peek()) && ch.codePointAt( 0 ) == EQUALS_SIGN ) {
                        return this.consumeSuffixMatch()
                    }

                    return simpleTokenWrapper.call( this, TOKEN_TYPE.DELIM )

                default:
                    return {
                        start: this.pos,
                        end:   this.pos + 1,
                        type:  404,
                        value: this.next()
                    }
            }
        }

        return {
            start: this.pos,
            end:   this.srcLen - 1,
            type:  TOKEN_TYPE.EOF
        }
    }

    //TODO: preprocessHandler
    next( offset = 1 ) {
        if ( ( this.pos + offset ) < this.srcLen ) {
            return this.src[ this.pos += offset ]
        }

        return NULL
    }

    //TODO: preprocessHandler
    peek( offset = 1 ) {
        if ( ( this.pos + offset ) < this.srcLen ) {
            return this.src[ this.pos + offset ]
        }

        return NULL
    }

    consumeComment() {
        let comment = [],
            p1, p2, value, start, end

        p1 = this.peek( 1 )
        p2 = this.peek( 2 )

        if ( p1 && p2 &&
            p1.codePointAt( 0 ) === SOLIDUS &&
            p2.codePointAt( 0 ) === ASTERISK
        ) {
            start = this.pos
            comment.push( p1, p2 )
            this.pos += 2

            while ( 1 ) {
                p1 = this.peek( 1 )
                p2 = this.peek( 2 )
                if ( !p1 || !p2 ||
                    ( p1.codePointAt( 0 ) !== ASTERISK &&
                    p2.codePointAt( 0 ) !== SOLIDUS ) ) {
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

        return NULL
    }

    consumeWhitespace() {
        let start      = this.pos,
            whitespace = [],
            cp, end

        while ( ( cp = this.peek() ) && isWhitespace( cp.codePointAt( 0 ) ) ) {
            whitespace.push( this.next() )
        }

        end = this.pos

        return {
                   start, end,
            type:  TOKEN_TYPE.WHITESPACE,
            value: whitespace.join( '' )
        }
    }

    consumeString() {
        let result = [],
            start  = this.pos,
            type   = TOKEN_TYPE.STRING,
            value, ch, end

        while ( ( ch = this.peek() ) ) {
            result.push( this.next() )
            //TODO: REVERSE SOLIDUS
            if ( ch.codePointAt( 0 ) === NEWLINE ) {
                type = TOKEN_TYPE.BAD_STRING
                break
            }
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

        while ( ( ch = this.peek() ) && isName( ch.codePointAt( 0 ) ) ) {
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
            type:  TOKEN_TYPE.IDENT,
            value: result.join( '' )
        }
    }

    consumeHash() {
        //TODO
    }

    consumeSuffixMatch() {
        //TODO
    }
}

export default Tokenizer
