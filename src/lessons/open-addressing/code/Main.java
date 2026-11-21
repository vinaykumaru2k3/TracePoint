import java.util.Arrays;

class LinearProbeSet {
    static final int EMPTY = -1, TOMB = -2;
    private final int[] slots = new int[7];
    private int size = 0;
    LinearProbeSet() { Arrays.fill(slots, EMPTY); }

    private int hash(int key) { return key % 7; }   // @a hash

    boolean add(int key) {                          // @a add.sig
        if (size == slots.length) return false;     // @a add.full
        int i = hash(key), tomb = -1;
        for (int n = 0; n < 7 && slots[i] != EMPTY; n++) { // @a add.probe
            if (slots[i] == key) return false;      // @a add.dup
            if (slots[i] == TOMB && tomb < 0) tomb = i; // @a add.tomb
            i = (i + 1) % 7;                        // @a add.next
        }
        slots[tomb >= 0 ? tomb : i] = key;          // @a add.write
        size++;
        return true;
    }

    boolean contains(int key) {                     // @a contains.sig
        int i = hash(key);
        for (int n = 0; n < 7 && slots[i] != EMPTY; n++) { // @a contains.probe
            if (slots[i] == key) return true;       // @a contains.hit
            i = (i + 1) % 7;                        // @a contains.next
        }
        return false;                               // @a contains.miss
    }

    boolean remove(int key) {                       // @a remove.sig
        int i = hash(key);
        for (int n = 0; n < 7 && slots[i] != EMPTY; n++) { // @a remove.probe
            if (slots[i] == key) { slots[i] = TOMB; size--; return true; } // @a remove.hit
            i = (i + 1) % 7;                        // @a remove.next
        }
        return false;                               // @a remove.miss
    }
}
