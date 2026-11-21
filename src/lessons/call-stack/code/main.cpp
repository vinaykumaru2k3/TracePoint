#include <iostream>

int fact(int n) {                       // @a cs.sig
    if (n == 0) return 1;               // @a cs.base
    int sub = fact(n - 1);              // @a cs.rec
    return n * sub;                     // @a cs.ret
}

int main() {
    std::cout << fact(4) << "\n";       // @a cs.main
}
