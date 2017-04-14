import test from 'ava'
import Parser from '../build'

test( 'string', ( t ) => {
    let parser = new Parser

    let str1 = parser.tokenize( '""' )[ 0 ],
        str2 = parser.tokenize( '"' )[ 0 ]

    t.truthy( str1.type === parser.tokenType.STRING, 'string type' )
    t.truthy( str2.type === parser.tokenType.BAD_STRING, 'bad string type' )
} )
