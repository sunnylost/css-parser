(function() {
    /**
     * Fix Number, DIMENSION, PERCENTAGE...
     */
    window.minifier = function(codes) {
        let parser = new CSSParser.default(), result = [], ast = parser.parse(codes);

        ast.value.forEach(node => {
            if (node.type === 'QUALIFIED_RULE') {
                let selector = [];

                //selector
                node.prelude.forEach(n => {
                    switch (n.type) {
                        case 'WHITESPACE':
                            if (selector.length) {
                                selector.push(' ');
                            }
                            break;

                        case 'COMMENT':
                            break;

                        default:
                            selector.push(n.value);
                    }
                });

                result.push(selector.join('').replace(/\s*$/, ''));

                //block
                if (node.block) {
                    var block = node.block;
                    result.push(block.token.value); //{

                    block.value.forEach(n => {
                        switch (n.type) {
                            case 'COMMENT':
                            case 'WHITESPACE':
                                break;

                            case 'NUMBER':
                            case 'DIMENSION':
                                result.push(n.value.repr);
                                break;

                            case 'PERCENTAGE':
                                result.push(n.value.value);
                                break;

                            case 'HASH':
                                if (n.value.length === 6) {
                                    var c = n.value[0], r = new RegExp('^' + c + '{6}$');

                                    if (r.test(n.value)) {
                                        result.push('#' + c + c + c);
                                        break;
                                    }
                                }

                                result.push('#');

                            default:
                                result.push(n.value);
                        }
                    });

                    result.push('}');
                }
            }
        });

        return result.join('');
    };
})();
