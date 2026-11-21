#include <vector>
using std::vector;

void subsets(const vector<int>& items, int i, vector<int>& path, vector<vector<int>>& out) {  // @a bt.sig
    if (i == (int)items.size()) {
        out.push_back(path); return;            // @a bt.leaf
    }
    path.push_back(items[i]);                   // @a bt.take
    subsets(items, i + 1, path, out);
    path.pop_back();                            // @a bt.undo
    subsets(items, i + 1, path, out);           // @a bt.skip
}
