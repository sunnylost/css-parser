//https://drafts.csswg.org/css-syntax-3/#tokenization
export default {
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
    LEFT_SQUARE_BRACKET:  24, //[
    RIGHT_SQUARE_BRACKET: 25, //]
    LEFT_PARENTHESIS:     26, //(
    RIGHT_PARENTHESIS:    27, //)
    LEFT_BRACE:           28, //{
    RIGHT_BRACE:          29  //}
}
