class Sort {
    static void insertionSort(int[] a) {                  // @a in.sig
        for (int i = 1; i < a.length; i++) {              // @a in.outer
            int key = a[i];                               // @a in.key
            int j = i - 1;
            while (j >= 0 && a[j] > key) {                // @a in.cmp
                a[j + 1] = a[j];                          // @a in.shift
                j--;
            }
            a[j + 1] = key;                               // @a in.drop
        }
    }
}
