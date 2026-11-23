int andOp(int a, int b) { return a & b; }                              // @a bit.and
int orOp(int a, int b) { return a | b; }                               // @a bit.or
int xorOp(int a, int b) { return a ^ b; }                              // @a bit.xor
int shl(int a, int k) { return (a << k) & 0xFF; }                      // @a bit.shl
int shr(int a, int k) { return a >> k; }                               // @a bit.shr

int countBits(int n) {
    int count = 0;
    while (n != 0) {                                                   // @a bit.loop
        n = n & (n - 1);                                               // @a bit.clear
        count++;                                                       // @a bit.tally
    }
    return count;                                                      // @a bit.ret
}

bool isPow2(int n) { return n > 0 && (n & (n - 1)) == 0; }             // @a bit.pow2
