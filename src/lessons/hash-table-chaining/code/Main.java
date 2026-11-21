import java.util.*;

class ChainedHashSet {
    private final List<LinkedList<Integer>> buckets = new ArrayList<>();
    ChainedHashSet() { for (int i = 0; i < 5; i++) buckets.add(new LinkedList<>()); }

    private int hash(int key) { return key % 5; }   // @a hash

    boolean add(int key) {                          // @a add.sig
        LinkedList<Integer> b = buckets.get(hash(key)); // @a add.bucket
        for (int k : b)                             // @a add.scan
            if (k == key) return false;             // @a add.dup
        b.addLast(key);                             // @a add.append
        return true;
    }

    boolean contains(int key) {                     // @a contains.sig
        for (int k : buckets.get(hash(key)))        // @a contains.scan
            if (k == key) return true;              // @a contains.hit
        return false;                               // @a contains.miss
    }

    boolean remove(int key) {                       // @a remove.sig
        Iterator<Integer> it = buckets.get(hash(key)).iterator(); // @a remove.bucket
        while (it.hasNext())                        // @a remove.scan
            if (it.next() == key) { it.remove(); return true; } // @a remove.hit
        return false;                               // @a remove.miss
    }
}
