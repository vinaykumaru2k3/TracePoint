class PairSum {
    // a must be sorted in ascending order
    static int[] pairWithSum(int[] a, int target) {     // @a tp.sig
        int lo = 0, hi = a.length - 1;
        while (lo < hi) {                               // @a tp.loop
            int sum = a[lo] + a[hi];                    // @a tp.sum
            if (sum == target) return new int[] { lo, hi };  // @a tp.found
            if (sum < target) lo++;                     // @a tp.lo
            else hi--;                                  // @a tp.hi
        }
        return new int[0];                              // @a tp.none
    }
}
