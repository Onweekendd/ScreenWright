import { ref, computed } from "vue";
import type { NamingIssueItem, UIMessage } from "../../types";

export function useNamingValidation(
  onMessage: (handler: (msg: UIMessage) => void) => () => void
) {
  const namingIssues = ref<NamingIssueItem[]>([]);
  const namingIssueSearch = ref("");
  const filteredNamingIssues = computed(() => {
    const q = namingIssueSearch.value.trim().toLowerCase();
    if (!q) return namingIssues.value;
    return namingIssues.value.filter(
      (item) =>
        item.childName.toLowerCase().includes(q) ||
        item.parentName.toLowerCase().includes(q) ||
        item.childId.includes(q)
    );
  });

  onMessage((msg) => {
    if (msg.type === "selectionChange") {
      namingIssues.value = [];
      namingIssueSearch.value = "";
    }
    if (msg.type === "scanNamingIssuesResult") {
      namingIssues.value = msg.issues;
    }
  });

  return { namingIssues, namingIssueSearch, filteredNamingIssues };
}
