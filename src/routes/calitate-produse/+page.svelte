<script lang="ts">
  import LegalDocument from '$lib/components/LegalDocument.svelte';
  import { produceQualityPolicy } from '$lib/legalDocuments';
</script>

<LegalDocument document={produceQualityPolicy} />
