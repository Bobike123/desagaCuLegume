<script lang="ts">
  import LegalDocument from '$lib/components/LegalDocument.svelte';
  import { companyInformation } from '$lib/legalDocuments';
</script>

<LegalDocument document={companyInformation} />
