import java.util.Arrays;
import java.util.Comparator;

class GreedyIntervals {
    // Each interval is {start, end}. Arrays.sort on objects is stable, so equal ends keep input order.
    static int maxIntervals(int[][] iv) {
        Arrays.sort(iv, Comparator.comparingInt(x -> x[1]));       // @a greedy.sort
        int lastEnd = 0;                                           // @a greedy.init
        int count = 0;                                             // @a greedy.init
        for (int[] x : iv) {                                       // @a greedy.loop
            if (x[0] >= lastEnd) {                                 // @a greedy.cmp
                count++;                                           // @a greedy.take
                lastEnd = x[1];                                    // @a greedy.last
            }
        }
        return count;                                              // @a greedy.ret
    }
}
