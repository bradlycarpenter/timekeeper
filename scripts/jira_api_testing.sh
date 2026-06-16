source .env

urlencode() {
    local raw_url="$1"
    printf '%s' "$raw_url" | jq -sRr @uri
}

handle_today() {
  local encoded_jql=$(urlencode 'project = "LUM" AND assignee = currentuser()')

  local response=$(
    curl --request GET \
      --url "https://$TEST_JIRA_DOMAIN/rest/api/3/search/jql?jql=$encoded_jql" \
      --user "$TEST_JIRA_EMAIL:$TEST_JIRA_API_KEY" \
      --header "Accept: application/json" \
      --silent)

  echo "$response" | jq '.'
}

case $1 in
  work)
    case $2 in
      today)
        handle_today
        ;;
      *)
        echo "Uknown argument: $2"
        ;;
    esac
    ;;
  *)
    echo "Unknown argument: $1"
    ;;
esac
