#include <algorithm>
#include <vector>

std::vector<int>& countingSort(std::vector<int>& a) {    // @a cnt.sig
    std::vector<int> count(*std::max_element(a.begin(), a.end()) + 1, 0);  // @a cnt.max
    for (int v : a)
        count[v]++;                                      // @a cnt.count
    int k = 0;
    for (int v = 0; v < (int)count.size(); v++)
        for (int c = 0; c < count[v]; c++)
            a[k++] = v;                                  // @a cnt.write
    return a;                                            // @a cnt.done
}
