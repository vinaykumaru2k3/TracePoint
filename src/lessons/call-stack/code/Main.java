class Main {
    static int fact(int n) {                // @a cs.sig
        if (n == 0) return 1;               // @a cs.base
        int sub = fact(n - 1);              // @a cs.rec
        return n * sub;                     // @a cs.ret
    }

    public static void main(String[] args) {
        System.out.println(fact(4));        // @a cs.main
    }
}
