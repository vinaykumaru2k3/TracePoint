#include <vector>

int linearSearch(const std::vector<int>& a, int target) {  // @a ls.sig
    for (int i = 0; i < (int)a.size(); i++) {               // @a ls.loop
        if (a[i] == target)                                 // @a ls.cmp
            return i;                                       // @a ls.hit
    }
    return -1;                                              // @a ls.none
}
