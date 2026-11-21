class RangeSums {
    final int[] p;

    RangeSums(int[] a) {                                // @a ps.sig
        p = new int[a.length + 1];
        p[0] = 0;                                       // @a ps.zero
        for (int i = 0; i < a.length; i++)              // @a ps.loop
            p[i + 1] = p[i] + a[i];                     // @a ps.add
    }

    // sum of a[l..r], both ends included
    int sum(int l, int r) {
        return p[r + 1] - p[l];                         // @a ps.query
    }
}
