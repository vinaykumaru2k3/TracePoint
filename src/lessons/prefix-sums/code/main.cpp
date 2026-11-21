#include <vector>

class RangeSums {
    std::vector<int> p;
public:
    explicit RangeSums(const std::vector<int>& a) : p(a.size() + 1) {  // @a ps.sig
        p[0] = 0;                                       // @a ps.zero
        for (size_t i = 0; i < a.size(); i++)           // @a ps.loop
            p[i + 1] = p[i] + a[i];                     // @a ps.add
    }

    // sum of a[l..r], both ends included
    int sum(int l, int r) const {
        return p[r + 1] - p[l];                         // @a ps.query
    }
};
