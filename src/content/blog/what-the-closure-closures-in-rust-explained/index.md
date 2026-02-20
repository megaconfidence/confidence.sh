---
title: "What The Closure!? Closures In Rust Explained"
pubDate: 2025-01-30
description: "What are Rust closures and how to use them"
tags: ["rust", "programming"]
heroImage: "./feature.webp"
---


Closures in Rust look a bit weird, and it’s not just their syntax, they behave differently from what you may expect too. They also share similarities with functions, making them easy to learn but sometimes confusing.

This article clearly explains what closures in Rust are, and how to use them in practice.

## Closure Syntax

Let's start by tackling one of the weird parts about closures; their syntax. They have a unique syntax, and unlike most Rust code, they don’t need types as the compiler infers it. Other than that, function and closures are quite similar. Take a look at the example below:

```rust
//function
fn add(a: i32, b: i32) -> i32 {
    a + b
}

//closure with types
|a: i32, b: i32| -> i32 {
    a + b
};

//closure without types
|a, b| {
    a + b
};

//closure compact. most popular!
|a, b| { a + b };
```

While Closures are usually untyped, nothing stops you from adding types. Though types are omitted for brevity, the compiler can infer the types from how the closure is used.

You may also have noticed closures don’t have names. That’s because they are anonymous functions designed to be non-public (i.e used only in your code for use in simple computations). That said, you can assign closures to variables to facilitate reuse.

```rust
let add = |a, b| { a + b };
```

Now you can call `add` can multiple times just like a function.

## Closures Capture Environment

![meme](./meme.webp)
Another difference between closures and functions is; closures can capture variables from their environment, while functions can't. As an example, imagine we wanted to print `name`:

```rust
let name = String::from("john");

fn fn_print() {
    println!("{}", name);
}

fn_print();
//⚠️⚠️⚠️
//error[E0434]: can't capture dynamic environment in a fn item
```

This doesn’t compile because functions can see variables outside their scope. The variables have to be explicitly passed as arguments. Not so for closures:

```rust
let name = String::from("mary");
let cl_print = || println!("{}", name);
cl_print();
//compiles like a charm ✨
```

It’s important to know that variables captured by closures may be borrowed mutably or immutably as per Rust conventions. As expected, this will affect the validity of that variable after the closure. Additionally, a variable may be moved into the closure using the `move` keyword. For example:

```rust
let name = String::from("john");
std::thread::spawn(move || println!("{}", name)).join().unwrap();
```

In the above example, `println` runs in a new thread so it makes sense to move `name` as it's not subsequently used in the main thread.

## Where are Closures used?

Closures are great for doing computations, especially when you need to capture values from the environment. They can have parameters, and can be passed as arguments to other functions. You may have come across closures in methods on types i.e on `map` :

```rust
let v = vec![1, 2, 3];
let v = v.into_iter().map(|x| x + 1).collect::<Vec<u8>>();
println!("{:#?}", v);
```

…or `unwrap_or_else` :

```rust
let num = Some(10).unwrap_or_else(|| -1);
println!("{:#?}", num);
```

Or on any method that takes a function or closure implementing any one of the `fn` traits. What are `fn` traits?

## Closure Traits

Closures implement one of three traits depending on what they do to captured values:

1. `FnOnce` - Applies to closures that can be called once i.e all closures. Closures that move captured values out of their body can’t implement other `fn` traits.
2. `FnMut` - Closures that can mutate captured values and be called multiple times.
3. `Fn` - Closures that neither move nor mutate captured values, allowing multiple concurrent calls

It’s good to keep this in mind especially when working with trait bounds

## Conclusion

Closures are quite handy and fun, fun, functional. They capture their environment and don’t need explicit type annotations, making them even more convenient. That’s it on closures. If you’d love to learn more about Rust, connect with me on [LinkedIn](https://www.linkedin.com/in/megaconfidence/) or [Twitter](https://x.com/megaconfidence). Bye!
