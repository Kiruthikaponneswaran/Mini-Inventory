from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """?page=N&page_size=M, capped so a client can't request the whole table."""

    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100
