---
title: "How It Works: Rust's Module System Finally Explained"
date: 2024-02-20
description: "Learn how Rust's module system works"
summary: "Learn how Rust's module system works"
tags: ["rust", "programming"]
---

Modules in Rust can be somewhat confusing. They don't line up with what you're used to from other languages, and can be frustrating to work with. Adding to this, the official docs and other resources don't help that much. What if someone wrote an article where you can learn everything you need to know about modules in Rust. Wouldn't that be awesome

In this article, I'll explain how Rust's module system works from top to bottom. I promise this article will be easy to understand and hope you'll find it helpful.

![Let start](./images/get_started.webp)

## Modules In A Nutshell

Modules in traditional languages like JavaScript or C++ are pretty straightforward. Modules are created by exporting functions or classes from a file for reuse later on. In these languages, modules are linked with projects' file system, and thus are easier to grok. Unfortunately, that is not the case with Rust.

In Rust, modules behave differently and are not related to the file system. This is what makes them seem a bit harder to understand. On the bright side, this allows for a higher degree of flexibility for code organization. Thus, modules can contain functions, types (i.e. structs, enums), traits, implement blocks and more.

A module is created using the `mod` key word followed by the module name and braces `{}` containing its members. Since modules encapsulate code, members are private by default and are made public using the `pub` keyword. Here's an example of declaring an _inline module_ (more inline and external modules later) in a `main.rs` file:

```rust
//main.rs
mod messages {
    pub fn say_hi() {
        println!("Hi there!");
    }
}

fn main() {
    messages::say_hi();
}
```

Fun fact, modules can contain other modules. Rust allows you to nest modules without restrictions. This is possible because modules work independently of the projects' file system. So you can go berserk and structure your program however you wish. Now that's power!

```rust
//main.rs
mod messages {
    pub mod english {
        pub fn say_hi() {
            println!("Hi there!");
        }
    }
}

fn main() {
    messages::english::say_hi();
}
```

This is mostly the fundamentals of the module system in Rust. But as you've guessed, there is more to using modules. Up next, we'll cover more concepts like external modules, visibility and paths. Ready? Let's go!

## External Modules

While building ‘real' apps, you'll likely want your modules to live as standalone files and imported to parts of your program where they are needed. Rust offers this feature through external modules (i.e. modules in separate files). Thus, internal modules are inlined, while external modules are in separate files.

There are two ways to organize your code using external modules in Rust, and you can mix and match both options. The first option, which I'll call _file_ modules, allows you to create modules in files with matching names. For instance, converting the last example into a _file_ module requires creating a `messages.rs` file, then the module is used in `main.rs`. After completing this, the project file tree looks this way:

```rust
.
├── Cargo.lock
├── Cargo.toml
└── src
    ├── messages.rs
    └── main.rs
```

Then, the content of each file:

```rust
//messages.rs
pub fn say_hi() {
    println!("Hi there!");
}

//main.rs
mod messages;

fn main() {
    messages::say_hi();
}
```

Notice there's no need to declare the module name using the `mod` keyword in `messages.rs`, because it's automatically inferred. Also in `main.rs`, the line `mod messages;`, informs the compiler that an external module called messages exists. Then the compiler searches for it, and includes during compilation.

Another option to create modules is what I'd like to call _folder_ modules. To be honest, I prefer this method because it makes adding submodules much easier later on. Using _folder_ modules involves creating a folder with the same name as the module, and placing its code in a `mod.rs` file within the folder. Here's an example:

```rust
.
├── Cargo.lock
├── Cargo.toml
└── src
    ├── messages
    │   └── mod.rs
    └── main.rs
```

Then, the files look like:

```rust
//messages/mod.rs
pub fn say_hi() {
    println!("Hi there!");
}

//main.rs
mod messages;

fn main() {
    messages::say_hi();
}
```

_Folder_ modules are like _file_ modules, except the differences in the project's file system. But as we'll explore submodules next, you'll come to appreciate the beauty of _folder_ modules. You'll also appreciate the flexibility of Rust's modules over modules in other languages.

## Nested Modules With Submodules

A unique feature of Rust's modules is the ability to create nested modules. For large applications, this can go a long way in keeping things in good shape. There are two ways to create submodules based on the external module option used in your project.

![Submodule meme](./images/submodules.webp)

If you go with _file_ modules, you can add submodules by creating a folder with the module's name, and adding any child or submodule with a matching file name in that folder. Let's see an example to make things clearer:

```rust
.
├── Cargo.lock
├── Cargo.toml
└── src
    ├── messages.rs
	├── messages
	│	├── english.rs
    │   └── japanese.rs
    └── main.rs
```

The content of the files:

```rust
//messages.rs
pub mod english;
pub mod japanese;

//messages/english.rs
pub fn say_hi() {
    println!("Hi there!");
}

//messages/japanese.rs
pub fn say_hi() {
    println!("こんにちは");
}

//main.rs
mod messages;

fn main() {
    messages::english::say_hi();
    messages::japanese::say_hi();
}
```

Using _folder_ submodules is not too different, but feels better organized. Here, you once again create a folder with a matching name, and each submodule as files in that folder. The only difference here is that `mod.rs` acts like a _C header_ file, only containing the declaration of the submodules. Or in JavaScript, it's like an `index.js` file containing the re-exported modules. Here's an example:

```rust
.
├── Cargo.lock
├── Cargo.toml
└── src
	├── messages
	│	├── mod.rs
	│	├── english.rs
    │   └── japanese.rs
    └── main.rs
```

The file contents:

```rust
//messages/mod.rs
pub mod english;
pub mod japanese;

//messages/english.rs
pub fn say_hi() {
    println!("Hi there!");
}

//messages/japanese.rs
pub fn say_hi() {
    println!("こんにちは");
}

//main.rs
mod messages;

fn main() {
    messages::english::say_hi();
    messages::japanese::say_hi();
}
```

There's no limit to the depth of nesting with submodules, and you can go as deep as you'd like. You can also mix and match the various options available, but it's best to stick with one for consistency. Now let's talk about module paths and how they work in Rust.

## Module Paths, Imports, And Exports

At this point, you've learned quite a lot about modules. You're doing great!

One last unusual aspect about modules is how paths work. You've likely noticed that file paths i.e `./path/to/module.rs` are not used here, and that's because modules are loosely linked with the file system. Rather, Rust introduces a somewhat new technique for accessing modules with module paths.

Module paths are built using the path separator operator i.e `::`. Thus, accessing a module in Rust will always be in the form; `path::to::module`. Like file paths, module paths are relative and require the module starting the path to be in scope. Member functions in a module can be accessed directly using module paths like we've seen before, i.e. `messages::japanese::say_hi();`.

To access a path relative to the parent of the current module, you can use `super::`. This is analogous to `../` in plain-old file system path. Also, to build an absolute path starting at the crate root, you can use `crate::` or just `::` with a path to the module, i.e. `::path::to::module`.

Let's see an example to put these concepts in context. Suppose we need to access members of one module from another, we could build a relative or absolute path, as the case may be. Here's an example to access the `print` utility function added to the `messages` module:

```rust
//main.rs
mod messages {
    pub mod utils {
        pub fn print(msg: &str) {
            println!("{}", msg);
        }
    }

    pub mod english {
        pub fn say_hi() {
			//relative path to print
            super::utils::print("Hi there!");
        }
        pub fn say_bye() {
			//absolute path to print
            crate::messages::utils::print("Bye bye!");
        }
    }
}

fn main() {
    messages::english::say_hi();
}
```

Imports are created with the `use` keyword. This is especially useful if a module is accessed more than once to keep, as it helps to keep the code concise. For example, we could import `print` with the `use` keyword to bring it in scope. Then, we can use it many times without needing to specify its path:

```rust
//main.rs
mod messages {
    pub mod utils {
        pub fn print(msg: &str) {
            println!("{}", msg);
        }
    }

    pub mod english {
        //import print once
        use super::utils::print;

        pub fn say_hi() {
            print("Hi there!"); //use here
        }
        pub fn say_bye() {
            print("Bye bye!"); //and here
        }
    }
}

fn main() {
    messages::english::say_hi();
}
```

Just like in other languages, imported modules can also be renamed using the `as` keyword, i.e. `use super::utils::print as msg_print`. This is useful in situations where members of two different modules have the same name. Using `as`, you can easily rename one import to avoid the name collision.

Lastly, modules can be re-exported with `pub use` declarations. This is used to shorten the module path or create shorter aliases to frequently used modules. Let's look at an example of `pub use` in action. As we do, note how it's used to shorten the path to `say_hi` without diminishing the original path:

```rust
//main.rs
mod messages {
    pub mod english {
        pub mod greetings {
            pub fn say_hi() {
                println!("Hi there!");
            }
        }
    }

	//re-export deeply nested path to module root
    pub use english::greetings::say_hi;
}

fn main() {
    messages::say_hi(); //shorter resulting path
    messages::english::greetings::say_hi(); //old path still works
}
```

Awesome! We've seen how module paths and exports works. Now let's wrap up the article by learning about visibility.

## Visibility

Visibility refers to parts of a module that can be accessed from outside. By default, all modules and their respective members are private in Rust. Optionally, they are made public using the `pub` keyword. This controls the visibility outside a module, as only public members are accessible. However, all members are always accessible within the module or its submodules.

![Visibility](./images/visiblilty.webp)

Here's an example to illustrate this. In the code below, `print` is a private member of the `english` module, and is accessible from `say_hi`, because it's in the `greetings` submodule. However, `print` is not accessible not from `say_bye` in `japanese` even though the module path is correct. This is because `print` is not accessible from modules exterior to `english`. Here's the code:

```rust
//main.rs
mod messages {
    pub mod english {
		//private member function
        fn print(msg: &str) {
            println!("{}", msg);
        }
        pub mod greetings {
            pub fn say_hi() {
                //child of print's parent. visible ✅
                print("Hi there!");
            }
        }
    }
    pub mod japanese {
        pub fn say_bye() {
            //correct module path but not visible ❌
            super::english::print("こんにちは");
        }
    }
}

fn main() {
    messages::english::greetings::say_hi();
}
```

This program doesn't compile because `print` is private and unreachable from `japanese`. This can be easily fixed by making `print` public using `pub`.

One more thing. In modules, all fields in a struct are private by default. To make the fields accessible outside the origin module, each field should be `pub`'ed as needed. Here's an example:

```rust
pub struct User {
    pub name: String,
    pub email: String,
    active: bool, //private field
    login_count: u64, //private field
}
```

## Conclusion

Rust's module system may be a bit confusing at first, but the concepts discuss here should help clear things up. Still have questions? That's okay, let's have a discussion in the comments.

If you enjoy all things Rust, [follow me on Twitter](https://twitter.com/megaconfidence). Cheers, have a good one!
