#!/usr/bin/env bash

get_issues() {
  local jql=$1
  curl --get \
    --url "https://$TEST_JIRA_DOMAIN/rest/api/3/search/jql" \
    --data-urlencode "jql=$jql" \
    --data-urlencode 'fields=summary' \
    --user "$TEST_JIRA_EMAIL:$TEST_JIRA_API_KEY" \
    --header "Accept: application/json" \
    --silent | jq '.'
}

case $1 in
  work)
    case $2 in
      progress)
        get_issues 'assignee = currentUser() AND status = "In Progress" AND sprint in openSprints()'
        ;;
      began)
        get_issues 'assignee = currentUser() AND status changed TO "In Progress" AFTER startOfDay() AND status = "In Progress"'
        ;;
      pr)
        get_issues 'assignee = currentUser() AND status changed TO "pr" AFTER startOfDay() AND status = "pr"'
        ;;
      done)
        get_issues 'assignee = currentUser() AND status changed TO "Done" AFTER startOfDay() AND status = "Done"'
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
