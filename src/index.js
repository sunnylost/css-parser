import TokenType from './tokenType';
import Tokenizer from './tokenizer';
import Parser from './parser';

class CSSParser {
    constructor() {
        this.tokenType = TokenType;
    }

    tokenize(src) {
        if (!src || !String(src).trim()) {
            return null;
        }

        return new Tokenizer(src).run(TokenType);
    }

    parse(src) {
        if (!src || !String(src).trim()) {
            return null;
        }

        return new Parser(this.tokenize(src)).run(TokenType);
    }
}

export default CSSParser;
