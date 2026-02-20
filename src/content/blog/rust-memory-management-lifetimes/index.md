---
title: "Ultimate Guide To Rust Lifetimes For Newbies"
pubDate: 2023-11-21
description: "Learn what lifetimes are and how they work in Rust"
tags: ["rust", "programming"]
heroImage: "./feature.webp"
---


Welcome to the last article of the Rust Memory Management series. The saga is finally coming to an end. We started by learning [how program memory works](../rust-memory-management-ownership/), then saw how to share data [through borrowing and references](../rust-memory-management-borrowing-and-references/). You'll need to catch up on these if you haven't, as it will help you understand the new concept introduced in this article.

In this article, we'll complete the trifecta of Rust's memory management system. We'll learn about lifetimes and how to use them. Let's go!

## What Are Lifetimes?

Imagine you work in a farm and your boss needs you to build a program to categorize crops. Armed with the knowledge of [borrowing and references](../rust-memory-management-borrowing-and-references/), you set out to design a performant solution. For memory efficiency, you use _borrowing_ to ensure that categorized crops point to their original allocation. Your boss is going to be so proud when he sees your program!

```rust
#[derive(Debug)]               //an attribute allowing us to print this struct
struct CropsByType<'a> {       //ignore the 'a for now...
    vegetables: &'a [String],
    fruits: &'a [String],
}

fn group_crops(crops: &[String]) -> CropsByType {
    CropsByType {
        vegetables: &crops[0..1],
        fruits: &crops[2..3],
    }
}

fn main() {
    let final_crops = {
        let crops = vec![
            "lettuce".to_string(),
            "spinach".to_string(),
            "apple".to_string(),
            "orange".to_string(),
        ];
        group_crops(&crops)
    };
    println!("{:?}", final_crops);
}
```

_Code block 1_

But there's a problem. Your code doesn't compile.

![Not so fast](./not_so_fast.gif)

Unfortunately, your program wasn't as invincible as you thought. Rust prevents the code from compiling because you've introduced a _use-after-freed_ bug. Let's take a closer look at this program together and figure out what's really going on.

```
error[E0597]: `crops` does not live long enough
  --> src/main.rs:22:21
   |
15 |     let final_crops = {
   |         ----------- borrow later stored here
16 |         let crops = vec![
   |             ----- binding `crops` declared here
...
22 |         group_crops(&crops)
   |                     ^^^^^^ borrowed value does not live long enough
23 |     };
   |     - `crops` dropped here while still borrowed

For more information about this error, try `rustc --explain E0597`.
```

`final_crops` defines a new scope (i.e with `{` and `}`) which computes its value. Within this scope a vector of `crops` is declared, and passed as a _reference_ to `group_crops`. `group_crops` returns a struct `CropsByType`, containing _slice_ references to the borrowed `crops` vector. The code block below (Code block 2) has been annotated to illustrate this flow.

> A slice is a reference to a range of elements in an array or vector. For example, `&crops[0..1]` is a reference to elements between index 0 and 1 in `crops`, i.e. `["lettuce", "spinach"]`

```rust
fn group_crops(crops: &[String]) -> CropsByType {
    CropsByType {
        vegetables: &crops[0..1], //slice of crops, referencing ["lettuce", "spinach"]
        fruits: &crops[2..3],     //slice of crops, referencing ["apple", "orange"]
    }
}

fn main() {
                                  //start here 👇
    let final_crops = {           //new scope created

        let crops = vec![         //crops vec is allocated
            "lettuce".to_string(),
            "spinach".to_string(),
            "apple".to_string(),
            "orange".to_string(),
        ];
        group_crops(&crops)      //CropsByType struct is returned
								 //but contains references to crops

    };  //scope exits, crops is deallocated
        //final_crops receives CropsByType which points to deallocated crops
	    //Rust prevents the program from compiling

    println!("{:?}", final_crops);
}
```

_Code block 2_

Following the flow, something interesting happens next. `CropsByType` is returned to `final_crops` when the scope exits, and `crops` is deallocated. But `CropsByType` points to `crops` since it doesn't _copy_ any of its values, so what happens next? Rust stops the program because it is trying to access deallocated memory. Proceeding any further can cause serious run-time bugs.

You get a better perspective of what's happening using the construct of _lifetimes_. Here is what I mean (Code block 3 below):

```rust
fn main() {
    let final_crops  = {    //lifetime of final_crops start here <─────┐
                                                                       │
		let crops = vec![   //lifetime of crops start here <──────┐    │
            "lettuce".to_string(),                                │    │
            "spinach".to_string(),                                │    │
            "apple".to_string(),                                  │    │
            "orange".to_string(),                                 │    │
        ];                                                        │    │
        group_crops(&crops)                                       │    │
    };                      //ends here <─────────────────────────┘    │
    println!("{:?}", final_crops);                                     │
}                           //ends here <──────────────────────────────┘
```

_Code block 3_

Viewing this through the lens of lifetimes, the compile error is Rust's way of telling us that `crops` has a shorter lifetime than `final_crops`, yet `final_crops` borrows the values of `crops`. Thus, lifetimes is a feature of the borrow checker used to ensure all borrows are valid. Lifetimes helps the compiler to prevent access to values that are deallocated.

To fix the compile error, we need to extend the lifetime of `crops` to be _at least of equal length_ to `final_crops`. To do this, move crops into the outer scope. Now the program compiles smoothly, and is finally invincible!

```rust
fn main() {
    let crops = vec![
        "lettuce".to_string(),
        "spinach".to_string(),
        "apple".to_string(),
        "orange".to_string(),
    ];
    let final_crops = { group_crops(&crops) };
    println!("{:?}", final_crops);
}
```

_Code block 4_

![One does not simply meme](./one_doesnt_simply.webp)

## Lifetime Annotations

In most cases, the Rust compiler is smart enough to infer the lifetimes of borrowed values, but may need a hint or two in complex scenarios. Such hints are given through _lifetime annotations_, another concept unique to Rust. Annotations are pretty straightforward. They help the compiler figure out the boundaries for which borrowed values must be alive.

Here's an example of a lifetime annotation from the crops program (Code block 5). The `CropsByType` struct has a lifetime parameter named `'a` (pronounced _tick a_)_._ Basically, it says instances of this struct **_must_** live as long as the vector of `crops` that its fields (i.e. vegetables & fruits) borrows from. Here, we are explicitly instructing the compiler to ensure that both `CropsByType` and `crops` have the same lifetime. Thus, `CropsByType` cannot outlive `crops` to which it borrows from.

```rust
struct CropsByType<'a> {      //defines a lifetime param for this struct called 'a
    vegetables: &'a [String], //the param 'a, is used here to tie CropsByType's lifetime to the crops slice
    fruits: &'a [String],     //same story here. 'a can be used as many times as needed within this struct
}
```

_Code block 5_

Lifetime parameters can be given any lowercase names i.e `'myawesomelifetimeparam`, but short letters like `'a` or `'b` are commonly used for brevity. Also, shorter letters are common because lifetime annotations are designed to be markers.

Lifetime annotations are not limited to structs, but are used on functions, methods and traits. Here's a rewrite of the `group_crops` function to show the lifetime annotations. Note that they were inferred by the compiler when omitted earlier. Occasionally, the compiler may require you specify the lifetimes in more complex scenarios.

```rust
//BEFORE 😐
fn group_crops(crops: &[String]) -> CropsByType {
    CropsByType {
        vegetables: &crops[0..1],
        fruits: &crops[2..3],
    }
}

//AFTER 🤩
fn group_crops<'x>(crops: &'x [String]) -> CropsByType {
    let vegetables: &'x [String] = &crops[0..1];
    let fruits: &'x [String] = &crops[2..3];
    CropsByType { vegetables, fruits }
}
```

_Code block 6_

![That would be great meme](./that_would_be_great.webp)

Lifetime annotations are quite straight forward, although their syntax may seem weird. But they work like regular function parameters. With that settled, let's explore one final detail about lifetimes.

## Static Lifetimes

The lifetime name `'static` is reserved in Rust to refer to values that live for the remaining lifetime of the program. Like global variables, they always exist throughout the program. The word _static_ is used because it refers to values that are hard coded within the binary of a compiled program.

For example, the variable `person` in the block below (Code block 7), references a series of bytes `"Confidence"` that is hard-coded into the binary of our program. Thus, this value isn't loaded into memory, but is directly read from the program's binary for efficiency. This is why the name `'static` is reserved. Sometimes, when then the `'static` lifetime name is omitted, it is automatically inferred by the compiler:

```rust
let person: &'static str = "Confidence";  //static string slice
let person: &str = "Confidence";          //same as above
let person = "Confidence";                //same as above
```

_Code block 7_

## Lifetimes The Smart Way

Thinking about your program in terms of lifetimes may be unusual, but it isn't complicated. If you're just getting started, you wouldn't come across it much because the compiler is good at figuring it out. Sometimes, however, you may get a friendly error message telling you to add them.

If you enjoy all things Rust, [follow me on Twitter](https://twitter.com/megaconfidence). Cheers, have a good one!
