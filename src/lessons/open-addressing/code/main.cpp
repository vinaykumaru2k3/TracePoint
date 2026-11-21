class LinearProbeSet {
    static constexpr int EMPTY = -1, TOMB = -2;
    int slots[7] = {EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY};
    int size = 0;
    int hash(int key) const { return key % 7; }     // @a hash
public:
    bool add(int key) {                             // @a add.sig
        if (size == 7) return false;                // @a add.full
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

    bool contains(int key) const {                  // @a contains.sig
        int i = hash(key);
        for (int n = 0; n < 7 && slots[i] != EMPTY; n++) { // @a contains.probe
            if (slots[i] == key) return true;       // @a contains.hit
            i = (i + 1) % 7;                        // @a contains.next
        }
        return false;                               // @a contains.miss
    }

    bool remove(int key) {                          // @a remove.sig
        int i = hash(key);
        for (int n = 0; n < 7 && slots[i] != EMPTY; n++) { // @a remove.probe
            if (slots[i] == key) { slots[i] = TOMB; size--; return true; } // @a remove.hit
            i = (i + 1) % 7;                        // @a remove.next
        }
        return false;                               // @a remove.miss
    }
};
