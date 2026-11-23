class BitManipulation {
    static int and(int a, int b) { return a & b; }                     // @a bit.and
    static int or(int a, int b) { return a | b; }                      // @a bit.or
    static int xor(int a, int b) { return a ^ b; }                     // @a bit.xor
    static int shl(int a, int k) { return (a << k) & 0xFF; }           // @a bit.shl
    static int shr(int a, int k) { return a >> k; }                    // @a bit.shr

    static int count(int n) {
        int count = 0;
        while (n != 0) {                                               // @a bit.loop
            n = n & (n - 1);                                           // @a bit.clear
            count++;                                                   // @a bit.tally
        }
        return count;                                                  // @a bit.ret
    }

    static boolean isPow2(int n) { return n > 0 && (n & (n - 1)) == 0; }   // @a bit.pow2
}
