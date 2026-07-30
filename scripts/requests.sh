#!/usr/bin/env bash

# Scratch client for poking Warp and Jira by hand.
#
# Run through `pnpm request`, which supplies WARP_DOMAIN from Doppler. Jira and
# Warp credentials are passed per call rather than stored: the app authenticates
# each user with their own OAuth token and their own Warp sign in, so there is no
# shared account to read from.

require() {
  local name=$1
  if [ -z "${!name}" ]; then
    echo "$name is not set. Prefix the call with it: $name=... pnpm request ..." >&2
    exit 1
  fi
}

get_issues() {
  local jql=$1
  require JIRA_DOMAIN
  require JIRA_EMAIL
  require JIRA_API_KEY
  curl --get \
    --url "https://$JIRA_DOMAIN/rest/api/3/search/jql" \
    --data-urlencode "jql=$jql" \
    --data-urlencode 'fields=summary' \
    -u "$JIRA_EMAIL:$JIRA_API_KEY" \
    -H "Accept: application/json" \
    -s | jq '.'
}

case $1 in
  work)
    case $2 in
      began)
        get_issues 'assignee = currentUser() AND status changed TO "In Progress" AFTER startOfDay() AND status = "In Progress"'
        ;;
      progress)
        get_issues 'assignee = currentUser() AND status = "In Progress" AND sprint in openSprints()'
        ;;
      pr)
        get_issues 'assignee = currentUser() AND status changed TO "pr" AFTER startOfDay() AND status = "pr"'
        ;;
      done)
        get_issues 'assignee = currentUser() AND status changed TO ("Done", "Quick Complete") AFTER startOfDay() AND statusCategory = Done'
        ;;
      status)
        # usage: pnpm request work status <PROJECT_KEY>
        require JIRA_DOMAIN
        require JIRA_EMAIL
        require JIRA_API_KEY
        curl --get \
          --url "https://$JIRA_DOMAIN/rest/api/3/project/${3:?project key required}/statuses" \
          -u "$JIRA_EMAIL:$JIRA_API_KEY" \
          -H "Accept: application/json" \
          -s | jq '.'
        ;;
      *)
        echo "Unknown argument: $2"
        ;;
    esac
    ;;
  sheet)
    require WARP_DOMAIN
    case $2 in
      auth)
        # usage: pnpm request sheet auth <email> <password>
        curl -X POST "https://$WARP_DOMAIN/api/account/authorise" \
          -H "Content-Type: application/json" \
          -d "{\"Email\": \"${3:?email required}\", \"Password\": \"${4:?password required}\"}" \
          -s | jq '.'
        ;;
      projects)
        # usage: pnpm request sheet projects <token> <page>
        curl --get \
          --url "https://$WARP_DOMAIN/api/Project?per_page=500&page=${4:-0}" \
          -H "Authorization: Bearer ${3:?token required}" \
          -s | jq '.'
        ;;
      person)
        # usage: pnpm request sheet person <token>
        curl --get \
          --url "https://$WARP_DOMAIN/api/users/me" \
          -H "Authorization: Bearer ${3:?token required}" \
          -s | jq '.'
        ;;
      post)
        # usage: pnpm request sheet post <token> <taskId> <personId> <costCodeId> <overtime> <hours> <entryDate> <comments>
        curl -X POST "https://$WARP_DOMAIN/api/entry/create" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer ${3:?token required}" \
          -d @- <<-EOF | jq '.'
					{
					  "TaskId": "${4:?taskId required}",
					  "PersonId": "${5:?personId required}",
					  "CostCodeId": "${6:-2}",
					  "DepartmentId": "1",
					  "Overtime": "${7:-0}",
					  "Time": "${8:-8}",
					  "EntryDate": "${9:?entryDate required}",
					  "Comments": "${10}",
					  "WorkLogId": "0",
					  "Audited": "0"
					}
					EOF
        ;;
      *)
        echo "Unknown argument: $2"
        ;;
    esac
    ;;
  api)
    case $2 in
      scheduled)
        # Fires the cron handler against a local `wrangler dev`.
        curl --get \
          --url "http://localhost:8787/cdn-cgi/handler/scheduled" \
          ${3:+--data-urlencode "time=$3"}
        ;;
      health)
        curl -s --url "http://localhost:8787/api/health" | jq '.'
        ;;
      *)
        echo "Unknown argument: $2"
        ;;
    esac
    ;;
  *)
    echo "Unknown argument: $1"
    ;;
esac
