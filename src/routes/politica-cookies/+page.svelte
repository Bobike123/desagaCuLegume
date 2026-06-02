<script lang="ts">
  import LegalDocument from '$lib/components/LegalDocument.svelte';
  import { cookiePolicy } from '$lib/legalDocuments';
</script>

<LegalDocument document={cookiePolicy} />
