//https://drafts.csswg.org/css-syntax-3/#tokenization
let types     = Object.create( null ),
    typeNames = [
        'EOF',
        'COMMENT',
        'IDENT',
        'FUNCTION',
        'AT_KEYWORD',
        'HASH',
        'STRING',
        'BAD_STRING',
        'URL',
        'BAD_URL',
        'DELIM',
        'NUMBER',
        'PERCENTAGE',
        'DIMENSION',
        'INCLUDE_MATCH',
        'DASH_MATCH',
        'PREFIX_MATCH',
        'SUFFIX_MATCH',
        'SUBSTRING_MATCH',
        'COLUMN',
        'WHITESPACE',
        'CDO',
        'CDC',
        'COLON', //:
        'SEMICOLON', //;
        'COMMA', //,
        'LEFT_SQUARE_BRACKET', //[
        'RIGHT_SQUARE_BRACKET', //]
        'LEFT_PARENTHESIS', //(
        'RIGHT_PARENTHESIS', //)
        'LEFT_CURLY_BRACKET', //{
        'RIGHT_CURLY_BRACKET',  //}
        'UNICODE_RANGE'
    ]

typeNames.forEach( ( type ) => {
    types[ type ] = type
} )

export default types
