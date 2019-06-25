import Tokenizer from './tokenizer'
import Parser from './parser'

class CSSParser {
    tokenize(src) {
        if (!src || !String(src).trim()) {
            return null
        }

        return new Tokenizer(src).run()
    }

    parse(src) {
        if (!src || !String(src).trim()) {
            return null
        }

        return new Parser(this.tokenize(src)).run()
    }
}

export default CSSParser
