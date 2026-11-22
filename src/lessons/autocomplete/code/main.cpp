#include <string>
#include <vector>
using namespace std;

struct TrieNode {
    TrieNode* kids[26] = {};
    bool end = false;
};

struct Autocomplete {
    TrieNode* root = new TrieNode();

    void insert(const string& w) {                      // @a ins.sig
        TrieNode* n = root;
        for (char c : w) {
            int i = c - 'a';
            if (!n->kids[i]) n->kids[i] = new TrieNode(); // @a ins.new
            n = n->kids[i];
        }
        n->end = true;                                  // @a ins.end
    }

    vector<string> complete(const string& p) {          // @a ac.sig
        TrieNode* n = root;
        for (char c : p) {
            n = n->kids[c - 'a'];                       // @a walk.step
            if (!n) return {};                          // @a walk.miss
        }
        vector<string> out;
        string word = p;
        collect(n, word, out);                          // @a ac.collect
        return out;                                     // @a ac.ret
    }

    void collect(TrieNode* n, string& word, vector<string>& out) { // @a dfs.sig
        if (n->end) out.push_back(word);                // @a dfs.word
        for (int i = 0; i < 26; i++) {
            if (!n->kids[i]) continue;
            word.push_back('a' + i);                    // @a dfs.down
            collect(n->kids[i], word, out);             // @a dfs.down
            word.pop_back();
        }
    }
};
