import os
import django

os.environ['DJANGO_SETTINGS_MODULE'] = 'api.settings'
django.setup()

from django.conf import settings

from indexer.backfill.transformer import Transformer
from indexer.backfill.loader import Loader
from indexer.backfill.extractor import Extractor
from abis import (
    FACTORY as FACTORY_ABI,
    ORGANIZATION as ORGANIZATION_ABI,
    FACTORY_EVENTS,
    ORGANIZATION_EVENTS
)
from job.models import ContractListener
from organization.models import Organization

class Backfill:
    def __init__(self):
        self.extractor = Extractor()
        self.transformer = Transformer()
        self.loader = Loader()

    def etl(self, queryset, abi, contract_events):
        contracts = [
            [
                contract.chain.lower(), 
                contract.ethereum_address,
                contract.last_block
            ] for contract in queryset 
        ]

        [
            events, 
            last_block
        ] = self.extractor.handle_contracts(contracts, abi, contract_events)
        events = self.transformer.handle_events(events)
        event_responses = self.loader.handle_events(events)

        for contract in queryset:
            contract.last_block = last_block
            contract.save() 

        if settings.DEBUG:
            for response in event_responses:
                print(response)

        return event_responses

    def backfill_factories(self):
        return self.etl(
            ContractListener.objects.filter(is_active=True), 
            FACTORY_ABI, 
            FACTORY_EVENTS
        )

    def backfill_organizations(self):
        return self.etl(
            Organization.objects.filter(
                is_active=True, 
                updated__gte=django.utils.timezone.now() - django.utils.timezone.timedelta(days=30)
            ), 
            ORGANIZATION_ABI, 
            ORGANIZATION_EVENTS
        )

# if __name__ == '__main__':
#     backfill = Backfill()
#     backfill.backfill_factories()
#     backfill.backfill_organizations()