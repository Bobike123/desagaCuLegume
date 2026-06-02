<script lang="ts">
  import LegalDocument from '$lib/components/LegalDocument.svelte';
  import { termsAndConditions } from '$lib/legalDocuments';
</script>

<LegalDocument document={termsAndConditions} />
