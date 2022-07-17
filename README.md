You may face the problem such as 'ReferenceError: TextEncoder is not defined'. How to solve it:
1. go to `node_modules/whatwg-url/lib/encoding.js`
2. replace 3 rows after 'use strict' statement with this 3 rows:
`var util= require('util');
const utf8Encoder = new util.TextEncoder();
const utf8Decoder = new util.TextDecoder("utf-8", { ignoreBOM: true });` 
