#include <list>
#include <vector>

class ChainedHashSet {
    std::vector<std::list<int>> buckets = std::vector<std::list<int>>(5);
    int hash(int key) const { return key % 5; }     // @a hash
public:
    bool add(int key) {                             // @a add.sig
        std::list<int>& b = buckets[hash(key)];     // @a add.bucket
        for (int k : b)                             // @a add.scan
            if (k == key) return false;             // @a add.dup
        b.push_back(key);                           // @a add.append
        return true;
    }

    bool contains(int key) const {                  // @a contains.sig
        for (int k : buckets[hash(key)])            // @a contains.scan
            if (k == key) return true;              // @a contains.hit
        return false;                               // @a contains.miss
    }

    bool remove(int key) {                          // @a remove.sig
        std::list<int>& b = buckets[hash(key)];     // @a remove.bucket
        for (auto it = b.begin(); it != b.end(); ++it) // @a remove.scan
            if (*it == key) { b.erase(it); return true; } // @a remove.hit
        return false;                               // @a remove.miss
    }
};
