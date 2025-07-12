use wasm_bindgen::prelude::*;
use num_bigint::BigInt;

#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    return String::from("Hello, ".to_owned() + name);
}

#[wasm_bindgen(raw_module = "../../dist/winston_logger.js")]
extern "C" {
    type Logger;

    #[wasm_bindgen(static_method_of = Logger, js_class = logger)]
    fn debug(a: &str);
}

#[wasm_bindgen]
pub async fn factorial_rust(n: u64) -> u64 {
    let mut factorial = 1;
    Logger::debug(&("Input number to factorial : ".to_owned() + &n.to_string()));
    for i in 1..n {
        factorial = factorial * (i + 1);
    }
    Logger::debug(&("Factorial of input number: ".to_owned() + &factorial.to_string()));
    return factorial;
}