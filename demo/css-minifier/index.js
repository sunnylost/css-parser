let fs        = require( 'fs' ),
    CSSParser = require( '../../' ).default,
    parser    = new CSSParser

let result = parser.parse( fs.readFileSync( './normalize.css', {
    encoding: 'utf8'
} ) )

//TODO
