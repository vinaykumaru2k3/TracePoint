#include <vector>

int sum(const std::vector<int>& a) {                // @a sum.sig
    int total = 0;
    for (size_t i = 0; i < a.size(); i++) {         // @a sum.loop
        total += a[i];                              // @a sum.add
    }
    return total;                                   // @a sum.return
}

bool hasDuplicate(const std::vector<int>& a) {      // @a dup.sig
    for (size_t i = 0; i < a.size(); i++) {         // @a dup.outer
        for (size_t j = i + 1; j < a.size(); j++) { // @a dup.inner
            if (a[i] == a[j]) {                     // @a dup.cmp
                return true;                        // @a dup.found
            }
        }
    }
    return false;                                   // @a dup.none
}
