source .env

case $1 in
  work)
    case $2 in
      today)
        curl --get \
          --url "https://$TEST_JIRA_DOMAIN/rest/api/3/search/jql" \
          --data-urlencode 'jql=project = "LUM" AND assignee = currentuser()' \
          --user "$TEST_JIRA_EMAIL:$TEST_JIRA_API_KEY" \
          --header "Accept: application/json" \
          --silent | jq '.'
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
