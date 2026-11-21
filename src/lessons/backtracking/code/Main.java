import java.util.*;

class Subsets {
    static void subsets(int[] items, int i, List<Integer> path, List<List<Integer>> out) {  // @a bt.sig
        if (i == items.length) {
            out.add(new ArrayList<>(path)); return;     // @a bt.leaf
        }
        path.add(items[i]);                             // @a bt.take
        subsets(items, i + 1, path, out);
        path.remove(path.size() - 1);                   // @a bt.undo
        subsets(items, i + 1, path, out);               // @a bt.skip
    }
}
