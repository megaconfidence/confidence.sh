---
title: "Rust Match Pattern Cheatsheet"
pubDate: 2024-12-18
description: "Rust pattern matching cheatsheet"
tags: ["rust", "programming"]
heroImage: "./feature.webp"
---


Remembering all the various patterns that can be used in a `match` expression can be quite tricky, so here’s a free comprehensive list you can reference anytime 😄.

| Pattern | Example |
| --- | --- |
| Wildcard | _ |
| Literals | 300 <br> ”john” |
| Range | 0 ..= 10 <br> ’a’ ..= ‘z’ |
| Variable | name <br> mut name <br> (Moves value into variable name) |
| ref Variable | ref name <br> ref mut name |
| Reference | &value <br> &(a, b) <br> (Matches only reference values) |
| Tuple | (x, y, z) |
| Array | [r, g, b] |
| Slice | [a, b] <br> [a, _, c] <br> [a, .., z] |
| Enum | Some(value) <br> None <br> Day::Monday |
| Struct | Axis(x, y) <br> Person {name, age} <br> Profile {id, name, …} <br> Shape {length: 10, active: true} |
| @ Binding | val @ 0 ..= 20 <br> ref square @ Shape::Square {..} |
| Multiple patterns | ‘a’ \| ‘b’ |
| Guard expression | x if x*x <= 10 |

Love to connect? Find me online on [LinkedIn](https://www.linkedin.com/in/megaconfidence/) or [Twitter](https://x.com/megaconfidence). Bye!
