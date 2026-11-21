class Counting {
    static int sum(int[] a) {                           // @a sum.sig
        int total = 0;
        for (int i = 0; i < a.length; i++) {            // @a sum.loop
            total += a[i];                              // @a sum.add
        }
        return total;                                   // @a sum.return
    }

    static boolean hasDuplicate(int[] a) {              // @a dup.sig
        for (int i = 0; i < a.length; i++) {            // @a dup.outer
            for (int j = i + 1; j < a.length; j++) {    // @a dup.inner
                if (a[i] == a[j]) {                     // @a dup.cmp
                    return true;                        // @a dup.found
                }
            }
        }
        return false;                                   // @a dup.none
    }
}
