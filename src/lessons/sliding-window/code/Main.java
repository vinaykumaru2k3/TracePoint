class Window {
    static int maxSum(int[] a, int k) {                 // @a sw.sig
        int sum = 0;
        for (int i = 0; i < k; i++) sum += a[i];        // @a sw.first
        int best = sum;
        for (int i = k; i < a.length; i++) {
            sum += a[i] - a[i - k];                     // @a sw.slide
            best = Math.max(best, sum);                 // @a sw.best
        }
        return best;                                    // @a sw.return
    }
}
