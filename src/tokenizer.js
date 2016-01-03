let //https://drafts.csswg.org/css-syntax-3/#tokenization
    TOKEN_TYPE        = {
        EOF:                  -2,
        COMMENT:              -1,
        IDENT:                0,
        FUNCTION:             1,
        AT_KEYWORD:           2,
        Hash:                 3,
        STRING:               4,
        BAD_STRING:           5,
        URL:                  6,
        BAD_URL:              7,
        DELIM:                8,
        NUMBER:               9,
        PERCENTAGE:           10,
        DIMENSION:            11,
        INCLUDE_MATCH:        12,
        DASH_MATCH:           13,
        PREFIX_MATCH:         14,
        SUFFIX_MATCH:         15,
        SUBSTRING_MATCH:      16,
        COLUMN:               17,
        WHITESPACE:           18,
        CDO:                  19,
        CDC:                  20,
        COLON:                21, //:
        SEMICOLON:            22, //;
        COMMA:                23, //,
        OPEN_SQUARE_BRACKET:  24, //[
        CLOSE_SQUARE_BRACKET: 25, //]
        OPEN_PARENTHESIS:     26, //(
        CLOSE_PARENTHESIS:    27, //)
        OPEN_BRACE:           28, //{
        CLOSE_BRACE:          29  //}
    },

    NULL              = null,
    CT                = 0x9, //CHARACTER TABULATION
    LF                = 0xa,  //LINE FEED
    FF                = 0xc, //FORM FEED
    CR                = 0xd, //CARRIAGE RETURN
    SPACE             = 0x20,
    ASTERISK          = 0x2a, //*
    SOLIDUS           = 0x2f,
    NEWLINE           = LF,

    //https://drafts.csswg.org/css-syntax-3/#input-preprocessing
    preprocessHanlder = ( cur, next ) => {
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

    isWhitespace      = cp => cp === NEWLINE || cp === CT || cp === SPACE

class Tokenizer {
    constructor( src ) {
        this.src    = src
        this.srcLen = src.length
        this.tokens = []
        this.cur    = null
        this.pos    = 0
    }

    run() {
        let token

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

        if ( ch = this.next() ) {
            cp = ch.codePointAt( 0 )

            token = this.consumeComment()

            if ( token ) {
                return token
            }

            switch ( cp ) {
                case NEWLINE:
                case CT:
                case SPACE:
                    token = this.consumeWhitespace()
                    break
            }

            return token
        }

        return NULL
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
            p2.codePointAt( 2 ) === ASTERISK
        ) {
            start = this.pos
            comment.push( [ SOLIDUS, ASTERISK ] )
            this.pos += 2

            while ( 1 ) {
                p1 = this.peek( 1 )
                p2 = this.peek( 2 )
                if ( !p1 || !p2 ||
                    p1.codePointAt( 0 ) !== SOLIDUS ||
                    p2.codePointAt( 2 ) !== ASTERISK ) {
                    comment.push( this.next() )
                }
                break
            }

            comment.push( [ ASTERISK, SOLIDUS ] )
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
}

export default Tokenizer
