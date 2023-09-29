---
title: "Rust Memory Management For The Rest Of Us: Ownership"
date: 2023-10-02
description: "Learn how memory management works in Rust"
summary: "Learn how memory management works in Rust"
tags: ["rust", "programming"]
---

If you're like me, managing memory is something you never had to think about because many high-level languages have built-in features to deallocate unused memory. This ‘garbage collection' feature makes programming easier because it abstracts another computing detail.

Unfortunately, that's not the case with Rust. Programmers are expected to know a bit about memory management, just like in C and C++. But Rust makes managing memory easy by introducing a new paradigm that guarantees memory safety while giving you control. It's the best of both worlds, so it's little wonder programmers love Rust.

This article and the next will help you learn some of Rust's built-in memory management concepts. By the end, you'll understand how they work and be better equipped to write kick-ass Rust programs. Let's get started.

## Stack And Heap Memory

Before going into the details of how Rust manages memory, let's take a step back to understand how computer memory works. Learning these concepts now will aid our understanding of how Rust handles memory.

There are two types of memory available to your program at runtime; the stack memory and heap memory. They both store data, but are different in **structure**, **size** of data that can be stored, and **speed** at which you can read/write data. Also, it's good to know Rust makes certain decisions based on the memory used, so it's important to know how they work.

The stack memory is linear memory that stores data in the same way it gets them. It is often described as a ‘last in first out' memory, and its data structure is modeled like an arbitrary stack or pile. Think of a pile of plates. If you need to add more plates to the pile, you simply add them to the top of the pile. And when you need a plate from the pile, you take the last one added to the top. In that way, it is a ‘last in first out' structure, and the stack memory is modeled in the same fashion.

![stack of plates](./images/stack.webp "credits: Adobe Stock")

The heap memory is a bit different. It is less structured, hence the name heap, and needs some bookkeeping to make usage possible. Here, the memory allocator finds an empty spot in the heap that is large enough to store the requested data. Heap memory is similar to making reservations at a restaurant. You walk into a restaurant and make a reservation for the number of guests with you, and the host goes to find a table large enough to fit your group. The next table where a reservation is made is a factor of the number of guests and the table size. Thus, it incurs the overhead of bookkeeping to manage effectively.

![restaurant](./images/restaurant.webp "credits: Shawnanggg on Unsplash")

Most languages differ in the way they choose to manage data in the heap memory. For instance, they make different decisions about how long to keep such data, and use different techniques to deallocate it. In Rust, memory allocation and deallocation is controlled through a set of rules called ownership.

## Ownership

Ownership is a set of rules enforced by the compiler that govern how memory is allocated and deallocated (marked as free-to-use) in Rust. This concept sets Rust apart from garbage-collected languages, and others requiring manual management. As a result, Rust is able to make safe guarantees on memory, without sacrificing performance. It's a new paradigm and might need some getting used to.

In most common scenarios, Rust chooses to free memory when the scope initializing it exits. For instance, in the block below, the vector of `numbers` allocated on the heap is deallocated when the `sum_numbers` function exits:

```rust
fn sum_numbers() -> i8 {
    let numbers = vec![3, 2, 1]; //allocates vector of numbers on heap
    let mut total = 0;
    for num in numbers.iter() {
        total += num;
    }
    return total;
} //function is out of scope. Thus, numbers is deallocated

fn main() {
    println!("{:?}", sum_numbers());
}
```

_Code block 1_

Deallocating memory when its context goes out of scope is a safe bet, because it guarantees memory is freed after use (i.e. not while in use within the scope). It also prevents deallocating twice, as this causes a hole new class of bugs.

Now, let's change the function a bit, so it not only returns total but also the numbers vector. In this situation, deallocating numbers when the function goes out of scope causes a _use-after-free_ bug because it's returned after the function exits. So Rust handles this situation a bit differently, and this is where the concept of ownership comes in.

```rust
fn sum_numbers() -> (i8, Vec<i8>) {
	let numbers = vec![3, 2, 1]; //allocates vector of numbers on heap
	let mut total = 0;
	for num in numbers.iter() {
		total += num;
	}
	return (total, numbers);
} //out of scope, but numbers can't be deallocated because it is returned
	//rather, numbers is moved to the callign scope

fn main() {
    println!("{:?}", sum_numbers()); //main takes ownership of numbers
} //numbers is deallocated
```

_Code block 2_

Whenever Rust creates a new allocation, it _assigns_ it to the allocating scope i.e. the scope **owns** the allocation. And when the scope exits, it is responsible for cleaning up all allocations tied to it. In the first example we looked at (Code block 1), `numbers` was created in the `sum_numbers` scope, thus `sum_numbers` was responsible for cleaning it up when it went out of scope. But in the second example (Code block 2), `numbers` is returned to the calling `main` function, and as a result, Rust _transfers_ its ownership from `sum_numbers` to `main`. Finally, when `main` goes out of scope, `numbers` is correctly deallocated.

Now, let's consider a lightly different situation. The example we've used so far has been modified such that `numbers` is initialized in `main`, and passed as a parameter to `sum_numbers`. Follow the flow of control and the comments to get a sense of how Rust handles memory management in this situation. As you'll notice, ownership of `numbers` is _moved_ to `sum_numbers`, and it's deallocated when `sum_numbers` goes out of scope:

```rust
fn sum_numbers(numbers: Vec<i8>) -> i8 { //takes ownership of numbers
    let mut total = 0;
    for num in numbers.iter() {
        total += num;
    }
    return total;
} //function is out of scope. Thus, numbers is deallocated

fn main() {
    let numbers = vec![3, 2, 1]; //allocates vector of numbers on heap
    println!("{:?}", sum_numbers(numbers)); //numbers is moved to sum_numbers
}
```

_Code block 3_

The big question is what happens if we try to access numbers again in the main function? Say, we try printing it again? Can you take a guess?

{{< alert "lightbulb">}}
Try running the block below and see what happens
{{< /alert >}}

```rust
fn sum_numbers(numbers: Vec<i8>) -> i8 { //takes ownership of numbers
    let mut total = 0;
    for num in numbers.iter() {
        total += num;
    }
    return total;
} //function is out of scope. Thus, numbers is deallocated

fn main() {
    let numbers = vec![3, 2, 1]; //allocates vector of numbers on heap
    println!("{:?}", sum_numbers(numbers)); //numbers is moved to sum_numbers
		println!("{:?}", sum_numbers(numbers)); //numbers is already deallocated. What happens next?
}
```

_Code block 4_

This program doesn't compile. We get a huge error message telling us we're breaking an important rule. The problem here is, after the first print statement, `numbers` was moved into the calling scope (i.e. `sum_numbers`), and deallocated after the function returned. Then, we tried accessing `numbers` in the second print statement _after it was already deallocated_. Accessing memory after deallocation causes a use-after-free bug, but the Rust compiler acts as a safety net and prevents compiling the program all together. You don't get to shoot yourself in the foot, isn't that awesome?

Since we have a good idea of why this program doesn't compile, it gives us a stating point to formulate a solution. We'll explore a more elegant solution later in the next article, but a workaround is creating a copy of `numbers` that is used in the first print statement. That copy then gets deallocated after the function exits. And finally, we can use the original variable in the second print statement:

```rust
fn sum_numbers(numbers: Vec<i8>) -> i8 {
    let mut total = 0;
    for num in numbers.iter() {
        total += num;
    }
    return total;
}

fn main() {
    let numbers = vec![3, 2, 1];
    println!("{:?}", sum_numbers(numbers.clone())); //a clone of numbers is moved to sum_numbers
	println!("{:?}", sum_numbers(numbers)); //then we can re-use numbers
}
```

_Code block 5_

You'll notice this program compiles without any errors. Hurray! You've now mastered Rust's ownership.

## Conclusion

This is a good point to stop. Like I mentioned, there are more elegant ways to solve this quirk of ownership. In the next article, we'll consider other new concepts such as references, borrowing and lifetimes. If you'd like to learn more about Rust, [follow me on Twitter](https://twitter.com/megaconfidence). Alright, the next article should be up soon, till then, see ya!
