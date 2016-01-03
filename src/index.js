import Tokenizer from './tokenizer'

class CSSParser {
    tokenize( src ) {
        if ( !src || !String( src ).trim() ) {
            //TODO
            return null
        }
        console.log( Tokenizer )
        return ( new Tokenizer( src ).run() )
    }
}

export default CSSParser
