import java.util.Arrays;

class Sort {
    static int[] countingSort(int[] a) {                  // @a cnt.sig
        int[] count = new int[Arrays.stream(a).max().getAsInt() + 1];  // @a cnt.max
        for (int v : a)
            count[v]++;                                   // @a cnt.count
        int k = 0;
        for (int v = 0; v < count.length; v++)
            for (int c = 0; c < count[v]; c++)
                a[k++] = v;                               // @a cnt.write
        return a;                                         // @a cnt.done
    }
}
